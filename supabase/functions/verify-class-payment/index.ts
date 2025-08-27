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
      paymentStatus: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed" 
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
      // Handle programmed class participation (existing logic)
      logStep("Processing class participation");
      
      // Check if user is already enrolled in this class
      const { data: existingParticipation, error: checkError } = await supabaseClient
        .from('class_participants')
        .select('id')
        .eq('class_id', classId)
        .eq('student_enrollment_id', user.id)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Error checking existing participation: ${checkError.message}`);
      }

      if (existingParticipation) {
        logStep("User already enrolled in class");
        return new Response(JSON.stringify({
          success: true,
          message: "Ya estás inscrito en esta clase",
          participationId: existingParticipation.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Create new class participation
      logStep("Creating class participation");
      const { data: participation, error: participationError } = await supabaseClient
        .from('class_participants')
        .insert([
          {
            class_id: classId,
            student_enrollment_id: user.id,
            status: 'active'
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-class-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});