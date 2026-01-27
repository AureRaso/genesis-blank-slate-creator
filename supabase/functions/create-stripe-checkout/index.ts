import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper to get subscription plan based on player count
interface SubscriptionPlan {
  id: string;
  name: string;
  max_players: number;
  price_monthly: number;
  stripe_price_id: string;
  stripe_product_id: string;
}

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

    const { club_id, success_url, cancel_url } = await req.json();

    if (!club_id) {
      throw new Error("club_id es requerido");
    }

    // Obtener información del club desde Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const clubResponse = await fetch(`${supabaseUrl}/rest/v1/clubs?id=eq.${club_id}&select=*`, {
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
    });

    const clubs = await clubResponse.json();
    const club = clubs[0];

    if (!club) {
      throw new Error("Club no encontrado");
    }

    // Contar jugadores del club (profiles con role='player' y club_id)
    const playerCountResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?club_id=eq.${club_id}&role=eq.player&select=id`,
      {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "count=exact",
        },
      }
    );

    const playerCountHeader = playerCountResponse.headers.get("content-range");
    const playerCount = playerCountHeader
      ? parseInt(playerCountHeader.split("/")[1] || "0", 10)
      : 0;

    console.log(`Club ${club.name} tiene ${playerCount} jugadores`);

    // Obtener todos los planes de suscripción ordenados por max_players
    const plansResponse = await fetch(
      `${supabaseUrl}/rest/v1/subscription_plans?is_active=eq.true&select=*&order=max_players.asc`,
      {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const plans: SubscriptionPlan[] = await plansResponse.json();

    if (!plans || plans.length === 0) {
      throw new Error("No hay planes de suscripción configurados");
    }

    // Seleccionar el plan adecuado según el número de jugadores
    // El plan correcto es el primero cuyo max_players >= playerCount
    let selectedPlan = plans.find(plan => plan.max_players >= playerCount);

    // Si el club tiene más jugadores que el plan más grande, usar el plan más grande
    if (!selectedPlan) {
      selectedPlan = plans[plans.length - 1];
    }

    console.log(`Plan seleccionado: ${selectedPlan.name} (${selectedPlan.stripe_price_id})`);

    const priceId = selectedPlan.stripe_price_id;

    // Buscar si ya existe un customer en Stripe para este club
    const subscriptionResponse = await fetch(
      `${supabaseUrl}/rest/v1/club_subscriptions?club_id=eq.${club_id}&select=stripe_customer_id&order=created_at.desc&limit=1`,
      {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const subscriptions = await subscriptionResponse.json();
    let customerId = subscriptions[0]?.stripe_customer_id;

    // Si no existe un customer, crearlo
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: club.name,
        email: club.contact_email || undefined,
        metadata: {
          club_id: club_id,
          club_name: club.name,
        },
      });
      customerId = customer.id;
    }

    // Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      allow_promotion_codes: true, // Habilitar códigos de descuento/promoción
      automatic_tax: {
        enabled: true, // Calcular IVA automáticamente según la ubicación del cliente
      },
      customer_update: {
        address: 'auto', // Guardar automáticamente la dirección del cliente desde el checkout
      },
      metadata: {
        club_id: club_id,
        subscription_plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
      },
      subscription_data: {
        metadata: {
          club_id: club_id,
          subscription_plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error en create-stripe-checkout:", error);
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
