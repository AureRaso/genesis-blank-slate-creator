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
    logStep("=== WEBHOOK DEBUG START ===");
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    // Log secret info (masked for security)
    logStep("Environment check", {
      hasStripeKey: !!stripeKey,
      stripeKeyPrefix: stripeKey?.substring(0, 7),
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret?.substring(0, 6),
      webhookSecretLength: webhookSecret?.length
    });

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

    logStep("Request details", {
      bodyLength: body.length,
      hasSignature: !!signature,
      signaturePreview: signature?.substring(0, 50) + "..."
    });

    if (!signature) {
      throw new Error("No stripe signature found");
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      logStep("Attempting signature verification...");
      // Use constructEventAsync for Deno/Edge Functions compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("✅ Webhook signature verified successfully!", { eventType: event.type });
    } catch (err) {
      logStep("❌ Webhook signature verification FAILED", {
        error: err.message,
        errorType: err.constructor.name,
        webhookSecretUsed: webhookSecret?.substring(0, 10) + "..." + webhookSecret?.substring(webhookSecret.length - 4)
      });
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
          // Fetch full subscription details to get period dates
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          logStep("Fetched subscription details", {
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            planId: session.metadata.subscription_plan_id,
            planName: session.metadata.plan_name
          });

          // Create or update club subscription with full details
          const subscriptionData: any = {
            club_id: session.metadata.club_id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            updated_at: new Date().toISOString()
          };

          // Add subscription_plan_id if available
          if (session.metadata.subscription_plan_id) {
            subscriptionData.subscription_plan_id = session.metadata.subscription_plan_id;
          }

          // Add period dates if available
          if (subscription.current_period_start) {
            subscriptionData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
          }
          if (subscription.current_period_end) {
            subscriptionData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }

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
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          canceledAt: subscription.canceled_at
        });

        // Update subscription in database
        const updateData: any = {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        };

        // Only add timestamps if they are valid numbers (not null/undefined)
        if (subscription.current_period_start && typeof subscription.current_period_start === 'number') {
          updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
        }

        if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
          updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        }

        // Only add canceled_at if it exists and is a valid number
        if (subscription.canceled_at && typeof subscription.canceled_at === 'number') {
          updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
        }

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

        // Prepare update data
        const deleteUpdateData: any = {
          status: 'canceled',
          updated_at: new Date().toISOString()
        };

        // Only add canceled_at if it's a valid timestamp
        if (subscription.canceled_at && typeof subscription.canceled_at === 'number') {
          deleteUpdateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
        }

        // Update subscription status to canceled for both tables
        const { error: updateError } = await supabaseClient
          .from('class_subscriptions')
          .update(deleteUpdateData)
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logStep("Error updating class_subscription on deletion", { error: updateError });
        } else {
          logStep("Class subscription marked as canceled");
        }

        // Also update club_subscriptions
        const { error: clubUpdateError } = await supabaseClient
          .from('club_subscriptions')
          .update(deleteUpdateData)
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