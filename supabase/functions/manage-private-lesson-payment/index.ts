import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    console.log("manage-private-lesson-payment: Starting");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request
    const { bookingId, action } = await req.json();

    if (!bookingId || !action) {
      throw new Error("bookingId and action are required");
    }

    if (action !== "capture" && action !== "cancel") {
      throw new Error('action must be "capture" or "cancel"');
    }

    console.log(`manage-private-lesson-payment: ${action} for booking ${bookingId}`);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("private_lesson_bookings")
      .select("id, stripe_payment_intent_id, stripe_payment_status, stripe_checkout_session_id, payment_method")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.log("Booking not found:", bookingId);
      return new Response(
        JSON.stringify({ success: false, message: "Booking not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Early return if not a Stripe payment
    if (booking.payment_method !== "stripe") {
      console.log(`Not a Stripe booking (payment_method=${booking.payment_method}), skipping`);
      return new Response(
        JSON.stringify({ success: true, message: "Not a Stripe payment", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // If we don't have the PaymentIntent ID yet (webhook didn't fire), try to recover it from the Checkout Session
    let paymentIntentId = booking.stripe_payment_intent_id;

    if (!paymentIntentId && booking.stripe_checkout_session_id) {
      console.log("No PaymentIntent ID found, recovering from Checkout Session:", booking.stripe_checkout_session_id);
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);
        if (session.payment_intent) {
          paymentIntentId = session.payment_intent as string;
          console.log("Recovered PaymentIntent:", paymentIntentId, "status:", session.payment_status);

          // Update booking with recovered PaymentIntent ID
          await supabaseAdmin
            .from("private_lesson_bookings")
            .update({
              stripe_payment_intent_id: paymentIntentId,
              stripe_payment_status: session.payment_status === "paid" ? "hold_placed" : "pending_checkout",
            })
            .eq("id", bookingId);
        }
      } catch (sessionError) {
        console.error("Error recovering PaymentIntent from session:", sessionError);
      }
    }

    if (!paymentIntentId) {
      console.log(`No PaymentIntent to ${action}. stripe_payment_status=${booking.stripe_payment_status}`);
      return new Response(
        JSON.stringify({ success: true, message: "No Stripe PaymentIntent to manage", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "capture") {
      try {
        const pi = await stripe.paymentIntents.capture(paymentIntentId);
        console.log(`Payment captured: ${pi.id}, amount: ${pi.amount_received}`);

        await supabaseAdmin
          .from("private_lesson_bookings")
          .update({ stripe_payment_status: "captured" })
          .eq("id", bookingId);

        return new Response(
          JSON.stringify({
            success: true,
            action: "captured",
            bookingId,
            amountCaptured: pi.amount_received,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (stripeError) {
        console.error("Stripe capture error:", stripeError);

        await supabaseAdmin
          .from("private_lesson_bookings")
          .update({ stripe_payment_status: "capture_failed" })
          .eq("id", bookingId);

        return new Response(
          JSON.stringify({
            success: false,
            action: "capture_failed",
            bookingId,
            error: stripeError instanceof Error ? stripeError.message : "Capture failed",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    if (action === "cancel") {
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
        console.log(`Payment hold cancelled: ${paymentIntentId}`);
      } catch (stripeError) {
        // PaymentIntent might already be cancelled — that's OK
        console.log("Stripe cancel warning (non-blocking):", stripeError instanceof Error ? stripeError.message : stripeError);
      }

      await supabaseAdmin
        .from("private_lesson_bookings")
        .update({ stripe_payment_status: "cancelled" })
        .eq("id", bookingId);

      return new Response(
        JSON.stringify({
          success: true,
          action: "cancelled",
          bookingId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Should never reach here
    return new Response(
      JSON.stringify({ success: false, message: "Unknown action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("manage-private-lesson-payment: Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
