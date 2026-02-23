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

    const { club_id, success_url, cancel_url, user_id } = await req.json();

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

    // Verificar si el usuario es superadmin y obtener todos sus clubes
    let isSuperadmin = false;
    let clubIds: string[] = [club_id];

    if (user_id) {
      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}&select=role`,
        {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      const profiles = await profileResponse.json();
      isSuperadmin = profiles[0]?.role === 'superadmin';

      // Si es superadmin, obtener todos sus clubes
      if (isSuperadmin) {
        const adminClubsResponse = await fetch(
          `${supabaseUrl}/rest/v1/admin_clubs?admin_profile_id=eq.${user_id}&select=club_id`,
          {
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
          }
        );
        const adminClubs = await adminClubsResponse.json();
        if (adminClubs && adminClubs.length > 0) {
          clubIds = adminClubs.map((ac: { club_id: string }) => ac.club_id);
        }
        console.log(`Superadmin con ${clubIds.length} clubes`);
      }
    }

    // Comprobar si el club tiene un plan forzado (override)
    let selectedPlan: SubscriptionPlan | undefined;

    if (club.override_subscription_plan_id) {
      const overridePlanResponse = await fetch(
        `${supabaseUrl}/rest/v1/subscription_plans?id=eq.${club.override_subscription_plan_id}&select=*`,
        {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      const overridePlans: SubscriptionPlan[] = await overridePlanResponse.json();
      if (overridePlans && overridePlans.length > 0) {
        selectedPlan = overridePlans[0];
        console.log(`Plan forzado (override) para ${club.name}: ${selectedPlan.name}`);
      }
    }

    // Si no hay override, calcular automáticamente por número de jugadores
    if (!selectedPlan) {
      // Contar jugadores (de todos los clubes si es superadmin, o solo del club actual)
      let playerCount = 0;

      if (isSuperadmin && clubIds.length > 1) {
        // Superadmin: contar de todos sus clubes
        const clubIdsFilter = clubIds.map(id => `"${id}"`).join(',');
        const playerCountResponse = await fetch(
          `${supabaseUrl}/rest/v1/profiles?club_id=in.(${clubIdsFilter})&role=eq.player&select=id`,
          {
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Prefer": "count=exact",
            },
          }
        );
        const playerCountHeader = playerCountResponse.headers.get("content-range");
        playerCount = playerCountHeader
          ? parseInt(playerCountHeader.split("/")[1] || "0", 10)
          : 0;
        console.log(`Total jugadores en ${clubIds.length} clubes: ${playerCount}`);
      } else {
        // Admin normal: contar solo del club actual
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
        playerCount = playerCountHeader
          ? parseInt(playerCountHeader.split("/")[1] || "0", 10)
          : 0;
        console.log(`Club ${club.name} tiene ${playerCount} jugadores`);
      }

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
      selectedPlan = plans.find(plan => plan.max_players >= playerCount);

      // Si el club tiene más jugadores que el plan más grande, usar el plan más grande
      if (!selectedPlan) {
        selectedPlan = plans[plans.length - 1];
      }
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

    // Prepare billing address and tax info for Stripe customer
    const EU_COUNTRIES_ISO: Record<string, string> = {
      'Alemania': 'DE', 'Austria': 'AT', 'Bélgica': 'BE', 'Bulgaria': 'BG', 'Chipre': 'CY',
      'Croacia': 'HR', 'Dinamarca': 'DK', 'Eslovaquia': 'SK', 'Eslovenia': 'SI', 'España': 'ES',
      'Estonia': 'EE', 'Finlandia': 'FI', 'Francia': 'FR', 'Grecia': 'GR', 'Hungría': 'HU',
      'Irlanda': 'IE', 'Italia': 'IT', 'Letonia': 'LV', 'Lituania': 'LT', 'Luxemburgo': 'LU',
      'Malta': 'MT', 'Países Bajos': 'NL', 'Polonia': 'PL', 'Portugal': 'PT',
      'República Checa': 'CZ', 'Rumanía': 'RO', 'Suecia': 'SE',
    };

    // Common country name → ISO mapping for non-EU countries
    const OTHER_COUNTRIES_ISO: Record<string, string> = {
      'Reino Unido': 'GB', 'Estados Unidos': 'US', 'México': 'MX', 'Argentina': 'AR',
      'Brasil': 'BR', 'Chile': 'CL', 'Colombia': 'CO', 'Perú': 'PE', 'Uruguay': 'UY',
      'Suiza': 'CH', 'Noruega': 'NO', 'Andorra': 'AD', 'Marruecos': 'MA',
    };

    const billingCountry = club.billing_country || 'España';
    const countryISO = EU_COUNTRIES_ISO[billingCountry] || OTHER_COUNTRIES_ISO[billingCountry] || undefined;

    const customerAddress = club.billing_address ? {
      line1: club.billing_address,
      city: club.billing_city || undefined,
      postal_code: club.billing_postal_code || undefined,
      state: club.billing_province || undefined,
      country: countryISO,
    } : undefined;

    // Determine tax_exempt status: reverse for intra-EU B2B with VAT number, exempt for non-EU, none for Spain
    const isSpain = billingCountry === 'España';
    const isIntraEU = !isSpain && !!EU_COUNTRIES_ISO[billingCountry];
    const taxExempt = isIntraEU && club.vat_number ? 'reverse' : (!isSpain && !EU_COUNTRIES_ISO[billingCountry]) ? 'exempt' : 'none';

    // Si no existe un customer, crearlo
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: club.legal_name || club.name,
        email: club.billing_email || club.contact_email || undefined,
        address: customerAddress,
        tax_exempt: taxExempt,
        metadata: {
          club_id: club_id,
          club_name: club.name,
        },
      });
      customerId = customer.id;

      // Register VAT number as tax_id for intra-EU customers
      if (isIntraEU && club.vat_number) {
        try {
          // Determine the tax_id type based on EU country ISO code
          const taxIdType = `eu_vat`;
          await stripe.customers.createTaxId(customerId, {
            type: taxIdType,
            value: club.vat_number,
          });
          console.log(`Registered EU VAT ID for customer: ${club.vat_number}`);
        } catch (taxIdError) {
          console.error("Error registering tax ID (non-blocking):", taxIdError);
        }
      }
    } else {
      // Update existing customer with latest billing data
      await stripe.customers.update(customerId, {
        name: club.legal_name || club.name,
        email: club.billing_email || club.contact_email || undefined,
        address: customerAddress,
        tax_exempt: taxExempt,
      });
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
        ...(clubIds.length > 1 ? { all_club_ids: clubIds.join(',') } : {}),
      },
      subscription_data: {
        metadata: {
          club_id: club_id,
          subscription_plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          ...(clubIds.length > 1 ? { all_club_ids: clubIds.join(',') } : {}),
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
