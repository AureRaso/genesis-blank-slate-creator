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

    // Parse request body — supports two flows:
    // 1. bookingId: existing booking in DB (legacy flow)
    // 2. bookingData: booking data without DB record (pay-first flow)
    const body = await req.json();
    const { bookingId, bookingData } = body;

    if (!bookingId && !bookingData) {
      throw new Error("bookingId or bookingData is required");
    }

    // Resolve booking details from either source
    let clubId: string;
    let totalPrice: number;
    let numPlayers: number;
    let lessonDate: string;
    let startTime: string;
    let endTime: string;

    if (bookingId) {
      // LEGACY FLOW: fetch existing booking from DB
      console.log("create-private-lesson-checkout: Booking ID:", bookingId);

      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("private_lesson_bookings")
        .select("id, booked_by_profile_id, club_id, trainer_profile_id, lesson_date, start_time, end_time, duration_minutes, num_companions, price_per_person, total_price, payment_method, status, booker_name")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        console.error("Booking not found:", bookingError);
        throw new Error("Booking not found");
      }

      if (booking.booked_by_profile_id !== user.id) {
        throw new Error("Unauthorized: You can only pay for your own bookings");
      }
      if (booking.payment_method !== "stripe") {
        throw new Error("This booking does not require online payment");
      }
      if (booking.status !== "pending") {
        throw new Error("Booking is not in a payable state");
      }

      clubId = booking.club_id;
      totalPrice = booking.total_price || 0;
      numPlayers = (booking.num_companions || 0) + 1;
      lessonDate = booking.lesson_date;
      startTime = booking.start_time;
      endTime = booking.end_time;
    } else {
      // PAY-FIRST FLOW: booking data provided directly (no DB record yet)
      console.log("create-private-lesson-checkout: Pay-first flow, no DB record");

      clubId = bookingData.club_id;
      totalPrice = bookingData.total_price || 0;
      numPlayers = (bookingData.num_companions || 0) + 1;
      lessonDate = bookingData.lesson_date;
      startTime = bookingData.start_time;
      endTime = bookingData.end_time;
    }

    // Fetch club with Stripe config
    const { data: club, error: clubError } = await supabaseAdmin
      .from("clubs")
      .select("id, name, stripe_account_id, stripe_onboarding_completed, enable_private_lesson_online_payment, currency")
      .eq("id", clubId)
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
    const totalAmountCents = Math.round(totalPrice * 100);
    const applicationFeeAmount = Math.round(totalAmountCents * PLATFORM_FEE_PERCENT);

    if (totalAmountCents < 50) {
      throw new Error("Total amount is too low for online payment (minimum €0.50)");
    }

    console.log("create-private-lesson-checkout: Amount:", totalAmountCents, "cents, Fee:", applicationFeeAmount, "cents");

    const currency = (club.currency || "EUR").toLowerCase();
    const origin = req.headers.get("origin") || "https://app.padelock.com";

    // Build URLs — pay-first flow uses Stripe's {CHECKOUT_SESSION_ID} template
    const successUrl = bookingId
      ? `${origin}/dashboard?pl_payment=success&booking_id=${bookingId}`
      : `${origin}/dashboard?pl_payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = bookingId
      ? `${origin}/dashboard?pl_payment=cancel&booking_id=${bookingId}`
      : `${origin}/dashboard?pl_payment=cancel`;

    // Create Stripe Checkout Session with manual capture (pre-authorization hold)
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
          booking_id: bookingId || "",
          club_id: clubId,
          type: "private_lesson",
        },
      },
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Clase particular - ${lessonDate}`,
              description: `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)} | ${numPlayers} jugador${numPlayers > 1 ? "es" : ""}`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId || "",
        club_id: clubId,
        type: "private_lesson",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("create-private-lesson-checkout: Session created:", session.id);

    // Only update DB if booking already exists (legacy flow)
    if (bookingId) {
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