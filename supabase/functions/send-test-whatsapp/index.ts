import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppTestRequest {
  userEmail: string;
  message?: string;
  testSecret?: string; // Optional secret for testing without JWT
}

/**
 * Format phone number for Whapi
 * Input: +34 612 345 678 or 612345678 or 605669244
 * Output: 34612345678@s.whatsapp.net
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If the number doesn't start with country code (assuming Spanish numbers)
  // Spanish mobile numbers start with 6 or 7 and are 9 digits long
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = '34' + digits; // Add Spain country code
  }

  // If it doesn't end with @s.whatsapp.net, add it
  if (!phone.includes('@')) {
    return `${digits}@s.whatsapp.net`;
  }

  return phone;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== WhatsApp Test Message Request ===');

    // Parse request body
    const { userEmail, message, testSecret }: WhatsAppTestRequest = await req.json();
    console.log('Request body:', { userEmail, messageProvided: !!message, hasTestSecret: !!testSecret });

    // Create Supabase admin client (usando service role para acceso completo)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedTestSecret = Deno.env.get('TEST_SECRET') || 'whatsapp-test-2025';

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      throw new Error('Service configuration error');
    }

    // Validate test secret if provided (bypass JWT validation)
    if (testSecret) {
      if (testSecret !== expectedTestSecret) {
        console.error('Invalid test secret provided');
        throw new Error('Invalid test secret');
      }
      console.log('✓ Test secret validated');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✓ Supabase admin client created');

    if (!userEmail) {
      throw new Error('Missing required field: userEmail');
    }

    // Get user from student_enrollments table by email
    const { data: studentData, error: studentError } = await supabaseClient
      .from('student_enrollments')
      .select('id, email, full_name, phone, level, club_id')
      .eq('email', userEmail)
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student:', studentError);
      throw new Error(`User not found in student_enrollments: ${userEmail}`);
    }

    console.log('✓ Student found:', {
      email: studentData.email,
      name: studentData.full_name,
      phone: studentData.phone
    });

    // Get phone from student record
    const phone = studentData.phone;

    if (!phone) {
      throw new Error(`No phone number found for user: ${userEmail}`);
    }

    console.log('✓ Phone found:', phone);

    // Format phone number for Whapi
    const formattedPhone = formatPhoneNumber(phone);
    console.log('✓ Formatted phone:', formattedPhone);

    // Get Whapi credentials from environment
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

    if (!whapiToken) {
      console.error('WHAPI_TOKEN environment variable not set');
      throw new Error('WHAPI_TOKEN not configured');
    }
    console.log('✓ WHAPI credentials present');

    // Default test message if not provided
    const testMessage = message || `¡Hola! 👋 Este es un mensaje de prueba de PadeLock.\n\nTu correo registrado es: ${userEmail}\n\nSi recibes este mensaje, significa que las notificaciones de WhatsApp están funcionando correctamente. ✅`;

    console.log('Sending WhatsApp message to:', formattedPhone);

    // Send WhatsApp message via Whapi.cloud
    const response = await fetch(`${whapiEndpoint}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: testMessage,
        typing_time: 2 // Simulate 2 seconds of typing
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whapi error:', errorText);
      throw new Error(`Whapi API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✓ WhatsApp message sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id || result.message_id,
        userEmail: userEmail,
        phone: phone,
        formattedPhone: formattedPhone,
        message: testMessage,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp test message:', error);

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
