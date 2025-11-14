import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY no está configurada");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { subscription_id, cancellation_reason } = await req.json();

    if (!subscription_id) {
      throw new Error("subscription_id es requerido");
    }

    // Crear cliente de Supabase para guardar el motivo de cancelación
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Guardar el motivo de cancelación en la base de datos
    if (cancellation_reason && cancellation_reason.trim().length >= 20) {
      await supabaseClient
        .from('club_subscriptions')
        .update({
          cancellation_reason: cancellation_reason.trim(),
          cancellation_requested_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription_id);
    }

    // Cancelar la suscripción en Stripe
    // cancel_at_period_end = true significa que se cancelará al final del período actual
    const subscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: cancellation_reason ? cancellation_reason.substring(0, 500) : undefined,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error en cancel-stripe-subscription:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error desconocido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
