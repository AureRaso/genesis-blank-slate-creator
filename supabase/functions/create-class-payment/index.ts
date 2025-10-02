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
  console.log(`[CREATE-CLASS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const body = await req.json();
    const { classId, slotId, className, trainerName, monthlyPrice, price, notes } = body;
    
    // Validate required parameters based on type
    if (slotId) {
      // Slot payment validation
      if (!slotId || !trainerName || price === undefined) {
        throw new Error("Missing required parameters for slot: slotId, trainerName, price");
      }
      if (price <= 0) {
        throw new Error("Invalid slot price amount");
      }
    } else {
      // Class payment validation
      if (!classId || !className || monthlyPrice === undefined) {
        throw new Error("Missing required parameters for class: classId, className, monthlyPrice");
      }
      if (monthlyPrice <= 0) {
        throw new Error("Invalid class price amount");
      }
    }
    
    logStep("Request parameters validated", body);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Determine payment details based on whether it's a class or slot
    let productName, productDescription, unitAmount, metadata, sessionMode;

    if (slotId) {
      // Payment for class slot - single payment
      productName = `Clase con ${trainerName}`;
      productDescription = `Reserva de clase individual`;
      unitAmount = Math.round(price * 100);
      sessionMode = "payment";
      metadata = {
        slotId: slotId,
        userId: user.id,
        notes: notes || '',
        type: "slot_payment"
      };
    } else {
      // Payment for programmed class - subscription
      productName = `Clase: ${className}`;
      productDescription = `Suscripción mensual de clase programada`;
      unitAmount = Math.round(monthlyPrice * 100);
      sessionMode = "subscription";
      metadata = {
        classId: classId,
        userId: user.id,
        type: "class_subscription"
      };
    }

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    logStep("Creating Stripe checkout session", { productName, unitAmount, mode: sessionMode });

    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancel`,
      metadata: metadata
    };

    if (sessionMode === "subscription") {
      // For subscription mode
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: productDescription
            },
            unit_amount: unitAmount,
            recurring: {
              interval: "month"
            }
          },
          quantity: 1,
        },
      ];
      sessionConfig.subscription_data = {
        metadata: metadata
      };
    } else {
      // For one-time payment mode
      sessionConfig.mode = "payment";
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: productDescription
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-class-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});