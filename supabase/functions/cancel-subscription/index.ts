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
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      throw new Error("Missing subscriptionId parameter");
    }
    logStep("Request parameters validated", { subscriptionId });

    // Get subscription details from database
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('class_subscriptions')
      .select(`
        *,
        student_enrollment:student_enrollments(
          created_by_profile_id
        )
      `)
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError) {
      throw new Error(`Subscription not found: ${subscriptionError.message}`);
    }

    // Verify the user owns this subscription
    if (subscription.student_enrollment.created_by_profile_id !== user.id) {
      throw new Error("Unauthorized: You don't own this subscription");
    }

    logStep("Subscription found and verified", {
      subscriptionId,
      stripeSubscriptionId: subscription.stripe_subscription_id
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Cancel the subscription in Stripe at period end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    );

    logStep("Stripe subscription updated", {
      subscriptionId: updatedSubscription.id,
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: updatedSubscription.current_period_end
    });

    // Update subscription in database
    const { error: updateError } = await supabaseClient
      .from('class_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      logStep("Error updating subscription in database", { error: updateError });
      throw updateError;
    }

    logStep("Subscription successfully marked for cancellation");

    return new Response(JSON.stringify({
      success: true,
      message: "Suscripción cancelada. Se mantendrá activa hasta el final del período actual.",
      cancelAt: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-subscription", { message: errorMessage });
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});