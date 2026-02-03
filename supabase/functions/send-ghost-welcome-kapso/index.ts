import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GhostWelcomeRequest {
  phone: string;
  studentName: string;
  trainerName: string;
  clubName: string;
  clubCode: string;
}

// Kapso API configuration
const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY') ?? '';
const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID') ?? '';
const KAPSO_BASE_URL = Deno.env.get('KAPSO_BASE_URL') || 'https://api.kapso.ai/meta/whatsapp/v24.0';

/**
 * Format phone number for WhatsApp API
 */
function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');

  // Add Spain country code if missing
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = '34' + digits;
  }

  return digits;
}

/**
 * Send WhatsApp ghost welcome template via Kapso API
 * Template: alta_alumno (Spanish)
 * Parameters: nombre_jugador, nombre_entrenador, club, código
 * Button: URL (static) "Terminar el registro" -> https://www.padelock.com/auth
 */
async function sendGhostWelcome(
  phone: string,
  studentName: string,
  trainerName: string,
  clubName: string,
  clubCode: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
    return { success: false, error: 'Kapso API not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  const url = `${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`;

  console.log(`👻 Sending ghost welcome to: ${formattedPhone}`);
  console.log(`   Student: ${studentName}, Trainer: ${trainerName}, Club: ${clubName}, Code: ${clubCode}`);

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: "alta_alumno",
      language: { code: "es_ES" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "nombre_jugador", text: studentName },
            { type: "text", parameter_name: "nombre_entrenador", text: trainerName },
            { type: "text", parameter_name: "club", text: clubName },
            { type: "text", parameter_name: "codigo", text: clubCode }
          ]
        }
      ]
    }
  };

  console.log('Request body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Kapso API error:', result);
      return {
        success: false,
        error: `Kapso API error ${response.status}: ${JSON.stringify(result)}`
      };
    }

    console.log('✅ Ghost welcome sent successfully:', result);
    return {
      success: true,
      messageId: result.messages?.[0]?.id || result.id
    };

  } catch (error) {
    console.error('❌ Error calling Kapso API:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: GhostWelcomeRequest = await req.json();

    if (!payload.phone || !payload.studentName || !payload.clubName || !payload.clubCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phone, studentName, clubName, clubCode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendGhostWelcome(
      payload.phone,
      payload.studentName,
      payload.trainerName || '',
      payload.clubName,
      payload.clubCode
    );

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
