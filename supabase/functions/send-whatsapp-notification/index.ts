import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  groupChatId: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== WhatsApp Notification Request ===');

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }
    console.log('✓ Authorization header present');

    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase admin client to verify the user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized: Invalid token');
    }
    console.log('✓ User authenticated:', user.email);

    // Parse request body
    const { groupChatId, message }: WhatsAppRequest = await req.json();
    console.log('Request body:', { groupChatId, messageLength: message?.length });

    if (!groupChatId || !message) {
      console.error('Missing fields - groupChatId:', !!groupChatId, 'message:', !!message);
      throw new Error('Missing required fields: groupChatId and message');
    }

    // Get Whapi credentials from environment
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

    if (!whapiToken) {
      console.error('WHAPI_TOKEN environment variable not set');
      throw new Error('WHAPI_TOKEN not configured');
    }
    console.log('✓ WHAPI credentials present');

    console.log('Sending WhatsApp message to:', groupChatId);

    // Send WhatsApp message via Whapi.cloud
    const response = await fetch(`${whapiEndpoint}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: groupChatId,
        body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whapi error:', errorText);
      throw new Error(`Whapi API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id || result.message_id,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
