import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HOLDED-CREATE-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const holdedApiKey = Deno.env.get("HOLDED_API_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const holdedWebhookSecret = Deno.env.get("HOLDED_WEBHOOK_SECRET");

    if (!holdedApiKey) throw new Error("HOLDED_API_KEY is not set");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // This function can be called in two ways:
    // 1. From the existing stripe-webhook (forwarding invoice.paid events)
    // 2. Directly with a stripeInvoiceId for manual sync

    const body = await req.json();
    const { stripeInvoiceId, stripeEvent } = body;

    let invoice: Stripe.Invoice;

    if (stripeEvent) {
      // Called from stripe-webhook forwarding
      invoice = stripeEvent.data.object as Stripe.Invoice;
      logStep("Processing forwarded Stripe event", { invoiceId: invoice.id });
    } else if (stripeInvoiceId) {
      // Manual sync - fetch invoice from Stripe
      invoice = await stripe.invoices.retrieve(stripeInvoiceId);
      logStep("Retrieved invoice from Stripe", { invoiceId: invoice.id });
    } else {
      throw new Error("Either stripeEvent or stripeInvoiceId is required");
    }

    // Check idempotency - has this invoice already been synced?
    const { data: existingInvoice } = await supabaseClient
      .from('holded_invoices')
      .select('id, status')
      .eq('stripe_invoice_id', invoice.id)
      .maybeSingle();

    if (existingInvoice && existingInvoice.status === 'synced') {
      logStep("Invoice already synced, skipping", { stripeInvoiceId: invoice.id });
      return new Response(
        JSON.stringify({ success: true, message: "Already synced", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Find the club by stripe_customer_id
    const stripeCustomerId = typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

    if (!stripeCustomerId) {
      throw new Error("No customer ID found in Stripe invoice");
    }

    logStep("Looking up club by stripe_customer_id", { stripeCustomerId });

    const { data: subscription, error: subError } = await supabaseClient
      .from('club_subscriptions')
      .select('club_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .limit(1)
      .maybeSingle();

    if (subError || !subscription) {
      logStep("No club found for stripe customer", { stripeCustomerId });
      // Record the failed attempt
      await supabaseClient.from('holded_invoices').upsert({
        stripe_invoice_id: invoice.id,
        club_id: '00000000-0000-0000-0000-000000000000', // placeholder
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency || 'eur',
        status: 'error',
        error_message: `No club found for Stripe customer ${stripeCustomerId}`,
        stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent : invoice.payment_intent?.id || null,
      }, { onConflict: 'stripe_invoice_id' });
      throw new Error(`No club found for Stripe customer: ${stripeCustomerId}`);
    }

    const clubId = subscription.club_id;

    // Get club billing data
    const { data: club, error: clubError } = await supabaseClient
      .from('clubs')
      .select('id, name, legal_name, tax_id, holded_contact_id, currency, billing_country, vat_number')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      throw new Error(`Club not found: ${clubId}`);
    }

    if (!club.holded_contact_id) {
      // Record as pending - club hasn't set up billing yet
      await supabaseClient.from('holded_invoices').upsert({
        stripe_invoice_id: invoice.id,
        club_id: clubId,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency || 'eur',
        status: 'pending',
        error_message: 'Club has not configured billing data in Holded yet',
        stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent : invoice.payment_intent?.id || null,
      }, { onConflict: 'stripe_invoice_id' });

      logStep("Club has no Holded contact, saving as pending", { clubId });
      return new Response(
        JSON.stringify({ success: true, message: "Saved as pending - no Holded contact", pending: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Build Holded invoice
    const invoiceDate = invoice.created
      ? invoice.created
      : Math.floor(Date.now() / 1000);

    const amountInEuros = (invoice.amount_paid || 0) / 100;

    // Determine tax rate based on club's billing country
    const EU_COUNTRIES = new Set([
      'Alemania', 'Austria', 'Bélgica', 'Bulgaria', 'Chipre', 'Croacia', 'Dinamarca',
      'Eslovaquia', 'Eslovenia', 'Estonia', 'Finlandia', 'Francia', 'Grecia', 'Hungría',
      'Irlanda', 'Italia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Países Bajos',
      'Polonia', 'Portugal', 'República Checa', 'Rumanía', 'Suecia',
    ]);

    const billingCountry = club.billing_country || 'España';
    const isSpain = billingCountry === 'España';
    const isIntraEU = !isSpain && EU_COUNTRIES.has(billingCountry);
    const isNonEU = !isSpain && !isIntraEU;

    // España → 21% IVA, UE intracomunitario → 0% (reverse charge), Fuera UE → 0% (no sujeto)
    const taxRate = isSpain ? 21 : 0;

    logStep("Tax calculation", { billingCountry, isSpain, isIntraEU, isNonEU, taxRate });

    // Build line items from Stripe invoice lines
    const holdedItems = (invoice.lines?.data || []).map((line) => ({
      name: line.description || `Suscripción PadeLock - ${club.name}`,
      desc: line.description || '',
      units: line.quantity || 1,
      subtotal: (line.amount || 0) / 100,
      tax: taxRate,
    }));

    // Fallback if no line items
    if (holdedItems.length === 0) {
      holdedItems.push({
        name: `Suscripción PadeLock - ${club.name}`,
        desc: `Factura Stripe ${invoice.number || invoice.id}`,
        units: 1,
        subtotal: amountInEuros,
        tax: taxRate,
      });
    }

    // Build notes with legal text based on tax type
    let invoiceNotes = `Ref. Stripe: ${invoice.number || invoice.id}`;
    if (isIntraEU) {
      invoiceNotes += `\nInversión del sujeto pasivo - Art. 84 LIVA`;
      if (club.vat_number) {
        invoiceNotes += `\nNIF-IVA cliente: ${club.vat_number}`;
      }
    } else if (isNonEU) {
      invoiceNotes += `\nOperación no sujeta a IVA - Art. 69 LIVA`;
    }

    const holdedInvoicePayload = {
      contactId: club.holded_contact_id,
      date: invoiceDate,
      currency: (invoice.currency || 'eur').toLowerCase(),
      language: 'es',
      notes: invoiceNotes,
      items: holdedItems,
    };

    logStep("Creating Holded invoice", holdedInvoicePayload);

    // Create invoice in Holded
    const holdedResponse = await fetch(
      'https://api.holded.com/api/invoicing/v1/documents/invoice',
      {
        method: 'POST',
        headers: {
          'key': holdedApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(holdedInvoicePayload),
      }
    );

    const holdedData = await holdedResponse.json();
    logStep("Holded create invoice response", { status: holdedResponse.status, data: holdedData });

    if (!holdedResponse.ok) {
      // Save error
      await supabaseClient.from('holded_invoices').upsert({
        stripe_invoice_id: invoice.id,
        club_id: clubId,
        amount: amountInEuros,
        currency: invoice.currency || 'eur',
        status: 'error',
        error_message: JSON.stringify(holdedData),
        stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent : invoice.payment_intent?.id || null,
      }, { onConflict: 'stripe_invoice_id' });
      throw new Error(`Holded API error: ${JSON.stringify(holdedData)}`);
    }

    const holdedInvoiceId = holdedData.id;
    const holdedInvoiceNum = holdedData.invoiceNum;

    // Mark invoice as paid in Holded
    logStep("Marking invoice as paid in Holded", { holdedInvoiceId });

    const payResponse = await fetch(
      `https://api.holded.com/api/invoicing/v1/documents/invoice/${holdedInvoiceId}/pay`,
      {
        method: 'POST',
        headers: {
          'key': holdedApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: invoiceDate,
          amount: amountInEuros,
          desc: `Cobro Stripe - ${invoice.number || invoice.id}`,
        }),
      }
    );

    const payData = await payResponse.json();
    logStep("Holded pay response", { status: payResponse.status, data: payData });

    // Save to holded_invoices table
    await supabaseClient.from('holded_invoices').upsert({
      stripe_invoice_id: invoice.id,
      club_id: clubId,
      holded_invoice_id: holdedInvoiceId,
      holded_invoice_num: holdedInvoiceNum,
      amount: amountInEuros,
      currency: invoice.currency || 'eur',
      status: 'synced',
      error_message: null,
      stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent : invoice.payment_intent?.id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

    logStep("Invoice synced successfully", {
      stripeInvoiceId: invoice.id,
      holdedInvoiceId,
      holdedInvoiceNum,
      amount: amountInEuros,
    });

    return new Response(
      JSON.stringify({
        success: true,
        holdedInvoiceId,
        holdedInvoiceNum,
        amount: amountInEuros,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});