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

    if (!session.metadata?.classId || session.metadata?.userId !== user.id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid session metadata" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const classId = session.metadata.classId;
    logStep("Payment verified, creating reservation", { classId, userId: user.id });

    // Check if user already has a reservation for this class
    const { data: existingReservation, error: checkError } = await supabaseClient
      .from('class_participants')
      .select('id')
      .eq('class_id', classId)
      .eq('student_enrollment_id', user.id) // Assuming we use user.id for player reservations
      .eq('status', 'active')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      throw new Error(`Error checking existing reservation: ${checkError.message}`);
    }

    if (existingReservation) {
      logStep("User already has reservation", { reservationId: existingReservation.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "User already enrolled in this class",
        reservationId: existingReservation.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create the class participation record
    const { data: reservation, error: reservationError } = await supabaseClient
      .from('class_participants')
      .insert({
        class_id: classId,
        student_enrollment_id: user.id, // Using user.id for now, might need adjustment
        status: 'active'
      })
      .select()
      .single();

    if (reservationError) {
      throw new Error(`Error creating reservation: ${reservationError.message}`);
    }

    logStep("Reservation created successfully", { reservationId: reservation.id });

    // Remove user from waitlist if they were on it
    const { error: waitlistError } = await supabaseClient
      .from('waitlists')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', user.id);

    if (waitlistError) {
      logStep("Warning: Could not remove from waitlist", { error: waitlistError.message });
    } else {
      logStep("User removed from waitlist");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      reservationId: reservation.id,
      message: "Payment verified and reservation created successfully"
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