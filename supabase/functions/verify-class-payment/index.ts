import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CLASS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role key to perform database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get request body
    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Missing sessionId parameter");
    }
    logStep("Request parameters validated", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", {
      sessionId: session.id,
      mode: session.mode,
      paymentStatus: session.payment_status,
      metadata: session.metadata
    });

    // Check if payment/subscription is complete
    const isPaymentComplete = session.mode === "payment"
      ? session.payment_status === "paid"
      : session.status === "complete";

    if (!isPaymentComplete) {
      return new Response(JSON.stringify({
        success: false,
        error: session.mode === "payment" ? "Payment not completed" : "Subscription not activated"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate that the payment is for the correct class/slot and user
    logStep("Validating payment metadata");
    const classId = session.metadata?.classId;
    const slotId = session.metadata?.slotId;
    const userId = session.metadata?.userId;
    const notes = session.metadata?.notes;
    
    if ((!classId && !slotId) || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing class/slot ID or user ID in session metadata" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    if (userId !== user.id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "User ID mismatch in payment session" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    logStep("Payment validation successful", { classId, slotId, userId });

    if (slotId) {
      // Handle class slot reservation
      logStep("Processing slot reservation");
      
      // Check if user already has a reservation for this slot
      const { data: existingReservation, error: checkError } = await supabaseClient
        .from('class_reservations')
        .select('id')
        .eq('slot_id', slotId)
        .eq('player_profile_id', user.id)
        .eq('status', 'reservado')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Error checking existing reservation: ${checkError.message}`);
      }

      if (existingReservation) {
        logStep("User already has reservation for this slot");
        return new Response(JSON.stringify({
          success: true,
          message: "Ya tienes una reserva para esta clase",
          reservationId: existingReservation.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Create new class reservation
      logStep("Creating class reservation");
      const { data: reservation, error: reservationError } = await supabaseClient
        .from('class_reservations')
        .insert([
          {
            slot_id: slotId,
            player_profile_id: user.id,
            status: 'reservado',
            notes: notes || null
          }
        ])
        .select()
        .single();

      if (reservationError) {
        logStep("Error creating reservation", { error: reservationError });
        throw reservationError;
      }

      logStep("Class reservation created successfully", { reservationId: reservation.id });

    } else if (classId) {
      // Handle programmed class participation or subscription
      const isSubscription = session.mode === "subscription";
      logStep("Processing class participation", { isSubscription });
      
      // Get class details for student enrollment
      const { data: classData, error: classError } = await supabaseClient
        .from('programmed_classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError) {
        throw new Error(`Error fetching class: ${classError.message}`);
      }

      // Check if user already has a student enrollment for this trainer/club
      logStep("Looking for existing enrollment", {
        userEmail: user.email,
        trainerId: classData.trainer_profile_id,
        clubId: classData.club_id
      });

      let { data: existingEnrollment, error: enrollmentError } = await supabaseClient
        .from('student_enrollments')
        .select('id')
        .eq('email', user.email)
        .eq('trainer_profile_id', classData.trainer_profile_id)
        .eq('club_id', classData.club_id)
        .eq('status', 'active')
        .single();

      logStep("Enrollment query result", {
        existingEnrollment,
        enrollmentError: enrollmentError?.message || null
      });

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw new Error(`Error checking existing enrollment: ${enrollmentError.message}`);
      }

      let studentEnrollmentId;
      let allEnrollmentIds; // Declare this here so it's available later

      if (!existingEnrollment) {
        // Create student enrollment
        logStep("Creating student enrollment");
        const { data: newEnrollment, error: newEnrollmentError } = await supabaseClient
          .from('student_enrollments')
          .insert([
            {
              trainer_profile_id: classData.trainer_profile_id,
              club_id: classData.club_id,
              created_by_profile_id: user.id,
              full_name: user.user_metadata?.full_name || user.email,
              email: user.email,
              phone: '',
              level: 3, // Default level
              weekly_days: classData.days_of_week || [],
              preferred_times: classData.start_time ? [classData.start_time] : [],
              enrollment_period: 'mensual',
              status: 'active'
            }
          ])
          .select('id')
          .single();

        if (newEnrollmentError) {
          logStep("Error creating enrollment", { error: newEnrollmentError });
          throw newEnrollmentError;
        }

        studentEnrollmentId = newEnrollment.id;
        logStep("Student enrollment created", { enrollmentId: studentEnrollmentId });
      } else {
        studentEnrollmentId = existingEnrollment.id;
        logStep("Using existing enrollment", { enrollmentId: studentEnrollmentId });
      }

      // Check if user is already participating in this class (any status)
      // We need to check all enrollments for this user, not just the current one
      const { data: allUserEnrollments, error: allEnrollmentsError } = await supabaseClient
        .from('student_enrollments')
        .select('id')
        .eq('email', user.email)
        .eq('trainer_profile_id', classData.trainer_profile_id)
        .eq('club_id', classData.club_id);

      if (allEnrollmentsError) {
        throw new Error(`Error checking all user enrollments: ${allEnrollmentsError.message}`);
      }

      allEnrollmentIds = allUserEnrollments?.map(e => e.id) || [studentEnrollmentId];

      logStep("Checking for existing participation across all enrollments", {
        allEnrollmentIds,
        classId
      });

      const { data: existingParticipation, error: checkError } = await supabaseClient
        .from('class_participants')
        .select('id, payment_status, status, student_enrollment_id')
        .eq('class_id', classId)
        .in('student_enrollment_id', allEnrollmentIds)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Error checking existing participation: ${checkError.message}`);
      }

      if (existingParticipation) {
        logStep("Found existing participation, updating payment status", {
          participationId: existingParticipation.id,
          currentPaymentStatus: existingParticipation.payment_status
        });

        let subscriptionId = null;

        // If this is a subscription, create subscription record
        if (isSubscription) {
          logStep("Creating subscription record");

          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          logStep("Subscription retrieved from Stripe", {
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end
          });

          // Use the enrollment ID from the existing participation
          const enrollmentIdForSubscription = existingParticipation.student_enrollment_id;

          // Create subscription record in database
          const { data: subscriptionRecord, error: subscriptionError } = await supabaseClient
            .from('class_subscriptions')
            .insert([
              {
                student_enrollment_id: enrollmentIdForSubscription,
                class_id: classId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end || false,
                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
              }
            ])
            .select()
            .single();

          if (subscriptionError) {
            logStep("Error creating subscription", { error: subscriptionError });
            throw subscriptionError;
          }

          subscriptionId = subscriptionRecord.id;
          logStep("Subscription created successfully", { subscriptionId });
        }

        // Update existing participation to mark as paid
        const updateData = {
          payment_status: 'paid',
          payment_verified: true,
          payment_date: new Date().toISOString(),
          payment_method: 'tarjeta',
          status: 'active',
          ...(subscriptionId && { subscription_id: subscriptionId })
        };

        logStep("Updating participation with data", {
          participationId: existingParticipation.id,
          updateData
        });

        const { data: updatedParticipation, error: updateError } = await supabaseClient
          .from('class_participants')
          .update(updateData)
          .eq('id', existingParticipation.id)
          .select()
          .single();

        logStep("Update result", {
          updatedParticipation,
          updateError: updateError?.message || null,
          updateErrorCode: updateError?.code || null
        });

        if (updateError) {
          logStep("Error updating participation payment status", { error: updateError });
          throw updateError;
        }

        logStep("Participation payment status updated successfully", {
          participationId: updatedParticipation.id,
          newPaymentStatus: updatedParticipation.payment_status
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Pago procesado correctamente",
          participationId: updatedParticipation.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Create new class participation (for cases where student wasn't pre-assigned)
      // Double-check one more time to prevent duplicates
      logStep("Final check before creating new participation");

      const { data: finalCheck, error: finalCheckError } = await supabaseClient
        .from('class_participants')
        .select('id')
        .eq('class_id', classId)
        .in('student_enrollment_id', allEnrollmentIds);

      if (finalCheckError) {
        logStep("Error in final duplicate check", { error: finalCheckError });
      } else if (finalCheck && finalCheck.length > 0) {
        logStep("Found existing participation in final check - avoiding duplicate", {
          existingParticipations: finalCheck
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Participación ya existe, no se creó duplicado",
          existingParticipationId: finalCheck[0].id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("Creating new class participation");

      let subscriptionId = null;

      // If this is a subscription, create subscription record
      if (isSubscription) {
        logStep("Creating subscription record for new participation");

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        logStep("Subscription retrieved from Stripe", {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end
        });

        // Create subscription record in database
        const { data: subscriptionRecord, error: subscriptionError } = await supabaseClient
          .from('class_subscriptions')
          .insert([
            {
              student_enrollment_id: studentEnrollmentId,
              class_id: classId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
            }
          ])
          .select()
          .single();

        if (subscriptionError) {
          logStep("Error creating subscription for new participation", { error: subscriptionError });
          throw subscriptionError;
        }

        subscriptionId = subscriptionRecord.id;
        logStep("Subscription created successfully for new participation", { subscriptionId });
      }

      const { data: participation, error: participationError } = await supabaseClient
        .from('class_participants')
        .insert([
          {
            class_id: classId,
            student_enrollment_id: studentEnrollmentId,
            status: 'active',
            payment_status: 'paid',
            payment_verified: true,
            payment_date: new Date().toISOString(),
            payment_method: 'tarjeta',
            ...(subscriptionId && { subscription_id: subscriptionId })
          }
        ])
        .select()
        .single();

      if (participationError) {
        logStep("Error creating participation", { error: participationError });
        throw participationError;
      }

      logStep("Class participation created successfully", { participationId: participation.id });

      // Try to remove user from waitlist if they were on it
      logStep("Attempting to remove from waitlist");
      try {
        await supabaseClient
          .from('waitlists')
          .delete()
          .eq('class_id', classId)
          .eq('user_id', user.id);
        logStep("Removed from waitlist (if existed)");
      } catch (waitlistError) {
        logStep("No waitlist entry found or error removing", { error: waitlistError });
        // Don't throw error here as this is optional cleanup
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      type: slotId ? 'slot_reservation' : 'class_participation',
      message: "Pago verificado y reserva creada exitosamente"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
      };
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } else {
      errorMessage = String(error);
    }

    logStep("ERROR in verify-class-payment", {
      message: errorMessage,
      details: errorDetails
    });

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: errorDetails
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});