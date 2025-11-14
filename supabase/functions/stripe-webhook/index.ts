import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No stripe signature found");
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout session completed", {
          sessionId: session.id,
          subscriptionId: session.subscription,
          customerId: session.customer
        });

        if (session.subscription && session.metadata?.club_id) {
          // Create or update club subscription
          const subscriptionData = {
            club_id: session.metadata.club_id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            updated_at: new Date().toISOString()
          };

          // Try to update first, if not found, insert
          const { error: updateError } = await supabaseClient
            .from('club_subscriptions')
            .upsert(subscriptionData, {
              onConflict: 'stripe_subscription_id',
              ignoreDuplicates: false
            });

          if (updateError) {
            logStep("Error creating/updating club subscription on checkout", { error: updateError });
          } else {
            logStep("Club subscription created/updated on checkout");
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing successful payment", {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid
        });

        if (invoice.subscription) {
          // Update subscription status to active for both tables
          const { error: updateError } = await supabaseClient
            .from('class_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (updateError) {
            logStep("Error updating class_subscription on successful payment", { error: updateError });
          } else {
            logStep("Class subscription updated to active on successful payment");
          }

          // Also update club_subscriptions
          const { error: clubUpdateError } = await supabaseClient
            .from('club_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (clubUpdateError) {
            logStep("Error updating club_subscription on successful payment", { error: clubUpdateError });
          } else {
            logStep("Club subscription updated to active on successful payment");
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing failed payment", {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_due
        });

        if (invoice.subscription) {
          // Update subscription status to past_due for both tables
          const { error: updateError } = await supabaseClient
            .from('class_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (updateError) {
            logStep("Error updating class_subscription on failed payment", { error: updateError });
          } else {
            logStep("Class subscription updated to past_due on failed payment");
          }

          // Also update club_subscriptions
          const { error: clubUpdateError } = await supabaseClient
            .from('club_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (clubUpdateError) {
            logStep("Error updating club_subscription on failed payment", { error: clubUpdateError });
          } else {
            logStep("Club subscription updated to past_due on failed payment");
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription update", {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });

        // Update subscription in database
        const updateData = {
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        };

        // Update class_subscriptions
        const { error: updateError } = await supabaseClient
          .from('class_subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logStep("Error updating class_subscription", { error: updateError });
        } else {
          logStep("Class subscription updated successfully", { subscriptionId: subscription.id });
        }

        // Also update club_subscriptions
        const { error: clubUpdateError } = await supabaseClient
          .from('club_subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);

        if (clubUpdateError) {
          logStep("Error updating club_subscription", { error: clubUpdateError });
        } else {
          logStep("Club subscription updated successfully", { subscriptionId: subscription.id });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", {
          subscriptionId: subscription.id,
          canceledAt: subscription.canceled_at
        });

        // Update subscription status to canceled for both tables
        const { error: updateError } = await supabaseClient
          .from('class_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date(subscription.canceled_at * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logStep("Error updating class_subscription on deletion", { error: updateError });
        } else {
          logStep("Class subscription marked as canceled");
        }

        // Also update club_subscriptions
        const { error: clubUpdateError } = await supabaseClient
          .from('club_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date(subscription.canceled_at * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (clubUpdateError) {
          logStep("Error updating club_subscription on deletion", { error: clubUpdateError });
        } else {
          logStep("Club subscription marked as canceled");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});