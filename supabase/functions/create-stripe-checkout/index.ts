import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

    const { club_id, success_url, cancel_url } = await req.json();

    if (!club_id) {
      throw new Error("club_id es requerido");
    }

    // Aquí deberías obtener el precio desde tu base de datos o configuración
    // Por ahora usaremos un precio fijo, pero deberías configurarlo en Stripe
    // y guardar el price_id en tu base de datos o en variables de entorno
    const priceId = Deno.env.get("STRIPE_MONTHLY_PRICE_ID");

    if (!priceId) {
      throw new Error("STRIPE_MONTHLY_PRICE_ID no está configurada. Configura el precio en Stripe y guarda el ID en las variables de entorno.");
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
        enabled: true, // Habilitar cálculo automático de impuestos
      },
      metadata: {
        club_id: club_id,
      },
      subscription_data: {
        metadata: {
          club_id: club_id,
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
