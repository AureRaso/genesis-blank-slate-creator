import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HOLDED-SYNC-CONTACT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const holdedApiKey = Deno.env.get("HOLDED_API_KEY");
    if (!holdedApiKey) throw new Error("HOLDED_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    ).auth.getUser();

    if (authError || !user) throw new Error("Not authenticated");

    const { clubId } = await req.json();
    if (!clubId) throw new Error("clubId is required");

    logStep("Syncing contact for club", { clubId, userId: user.id });

    // Verify user has access to this club
    const { data: club, error: clubError } = await supabaseClient
      .from('clubs')
      .select('id, name, legal_name, tax_id, legal_entity_type, billing_email, billing_address, billing_city, billing_postal_code, billing_province, billing_country, phone, holded_contact_id, vat_number')
      .eq('id', clubId)
      .single();

    if (clubError || !club) throw new Error("Club not found");

    // Validate required billing fields
    if (!club.legal_name || !club.tax_id) {
      throw new Error("Datos fiscales incompletos: razón social y NIF/CIF son obligatorios");
    }

    // Determine tax operation based on country
    const EU_COUNTRIES = new Set([
      'Alemania', 'Austria', 'Bélgica', 'Bulgaria', 'Chipre', 'Croacia', 'Dinamarca',
      'Eslovaquia', 'Eslovenia', 'Estonia', 'Finlandia', 'Francia', 'Grecia', 'Hungría',
      'Irlanda', 'Italia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Países Bajos',
      'Polonia', 'Portugal', 'República Checa', 'Rumanía', 'Suecia',
    ]);
    const country = club.billing_country || 'España';
    const isSpain = country === 'España';
    const isIntraEU = !isSpain && EU_COUNTRIES.has(country);
    // España → general, UE intracomunitario → intra, Fuera UE → exempt
    const taxOperation = isSpain ? 'general' : isIntraEU ? 'intra' : 'exempt';

    logStep("Tax operation", { country, isSpain, isIntraEU, taxOperation });

    // Build Holded contact payload
    // Note: vatnumber field is read-only in Holded API, must be set manually in Holded UI
    const contactPayload: Record<string, any> = {
      name: club.legal_name,
      tradeName: club.name,
      code: club.tax_id,
      email: club.billing_email || '',
      phone: club.phone || '',
      type: 'client',
      isperson: club.legal_entity_type === 'autonomo',
      taxOperation,
      billAddress: {
        address: club.billing_address || '',
        city: club.billing_city || '',
        postalCode: club.billing_postal_code || '',
        province: club.billing_province || '',
        country: country,
      },
      defaults: {
        language: 'es',
        currency: 'eur',
      },
    };

    logStep("Holded contact payload", contactPayload);

    let holdedContactId = club.holded_contact_id;
    let holdedResponse: Response;

    if (holdedContactId) {
      // Update existing contact
      logStep("Updating existing Holded contact", { holdedContactId });
      holdedResponse = await fetch(
        `https://api.holded.com/api/invoicing/v1/contacts/${holdedContactId}`,
        {
          method: 'PUT',
          headers: {
            'key': holdedApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactPayload),
        }
      );
    } else {
      // Create new contact
      logStep("Creating new Holded contact");
      holdedResponse = await fetch(
        'https://api.holded.com/api/invoicing/v1/contacts',
        {
          method: 'POST',
          headers: {
            'key': holdedApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactPayload),
        }
      );
    }

    const holdedData = await holdedResponse.json();
    logStep("Holded API response", { status: holdedResponse.status, data: holdedData });

    if (!holdedResponse.ok) {
      throw new Error(`Holded API error: ${JSON.stringify(holdedData)}`);
    }

    // Save the Holded contact ID if it's a new contact
    if (!holdedContactId && holdedData.id) {
      holdedContactId = holdedData.id;
      const { error: updateError } = await supabaseClient
        .from('clubs')
        .update({ holded_contact_id: holdedContactId })
        .eq('id', clubId);

      if (updateError) {
        logStep("Error saving holded_contact_id", { error: updateError });
        throw new Error("Contact created in Holded but failed to save ID");
      }

      logStep("Holded contact ID saved to club", { holdedContactId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        holdedContactId,
        isNew: !club.holded_contact_id,
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