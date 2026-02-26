import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLATFORM_FEE_PERCENT = 0.07; // 7% commission

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    console.log("create-private-lesson-checkout: Starting");

    // Initialize Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    console.log("create-private-lesson-checkout: User authenticated:", user.email);

    // Parse request body
    const { bookingId } = await req.json();

    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    console.log("create-private-lesson-checkout: Booking ID:", bookingId);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("private_lesson_bookings")
      .select("id, booked_by_profile_id, club_id, trainer_profile_id, lesson_date, start_time, end_time, duration_minutes, num_companions, price_per_person, total_price, payment_method, status, booker_name")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      throw new Error("Booking not found");
    }

    // Verify the user is the booker
    if (booking.booked_by_profile_id !== user.id) {
      throw new Error("Unauthorized: You can only pay for your own bookings");
    }

    // Verify booking is in the right state
    if (booking.payment_method !== "stripe") {
      throw new Error("This booking does not require online payment");
    }

    if (booking.status !== "pending") {
      throw new Error("Booking is not in a payable state");
    }

    // Fetch club with Stripe config
    const { data: club, error: clubError } = await supabaseAdmin
      .from("clubs")
      .select("id, name, stripe_account_id, stripe_onboarding_completed, enable_private_lesson_online_payment, currency")
      .eq("id", booking.club_id)
      .single();

    if (clubError || !club) {
      throw new Error("Club not found");
    }

    // Verify club has online payments enabled and Stripe connected
    if (!club.enable_private_lesson_online_payment) {
      throw new Error("This club has not enabled online payments for private lessons");
    }

    if (!club.stripe_account_id || !club.stripe_onboarding_completed) {
      throw new Error("This club has not completed Stripe Connect onboarding");
    }

    console.log("create-private-lesson-checkout: Club verified:", club.name, "Stripe account:", club.stripe_account_id);

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Calculate amounts (in cents)
    const totalAmountCents = Math.round((booking.total_price || 0) * 100);
    const applicationFeeAmount = Math.round(totalAmountCents * PLATFORM_FEE_PERCENT);

    if (totalAmountCents < 50) {
      throw new Error("Total amount is too low for online payment (minimum €0.50)");
    }

    console.log("create-private-lesson-checkout: Amount:", totalAmountCents, "cents, Fee:", applicationFeeAmount, "cents");

    const currency = (club.currency || "EUR").toLowerCase();
    const origin = req.headers.get("origin") || "https://app.padelock.com";

    // Create Stripe Checkout Session with manual capture (pre-authorization hold)
    const numPlayers = (booking.num_companions || 0) + 1;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: {
        capture_method: "manual",
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: club.stripe_account_id,
        },
        metadata: {
          booking_id: bookingId,
          club_id: booking.club_id,
          type: "private_lesson",
        },
      },
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Clase particular - ${booking.lesson_date}`,
              description: `${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)} | ${numPlayers} jugador${numPlayers > 1 ? "es" : ""}`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        club_id: booking.club_id,
        type: "private_lesson",
      },
      success_url: `${origin}/dashboard?pl_payment=success&booking_id=${bookingId}`,
      cancel_url: `${origin}/dashboard?pl_payment=cancel&booking_id=${bookingId}`,
    });

    console.log("create-private-lesson-checkout: Session created:", session.id);

    // Update booking with checkout session ID
    const { error: updateError } = await supabaseAdmin
      .from("private_lesson_bookings")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_status: "pending_checkout",
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Error updating booking:", updateError);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-private-lesson-checkout: Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
