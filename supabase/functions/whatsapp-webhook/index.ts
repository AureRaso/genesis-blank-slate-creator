import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/**
 * Webhook to receive WhatsApp button responses from Whapi
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== WhatsApp Webhook Received ===');

    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Whapi sends button responses with this structure:
    // {
    //   messages: [{
    //     type: 'reply',
    //     reply: {
    //       type: 'buttons_reply',
    //       buttons_reply: {
    //         id: 'ButtonsV3:absence_<participation_id>',
    //         title: '❌ No puedo ir (1)'
    //       }
    //     },
    //     from: '34612345678@s.whatsapp.net',
    //     ...
    //   }]
    // }

    // Extract message data
    const messages = payload.messages || [];
    if (messages.length === 0) {
      console.log('No messages in webhook payload');
      return new Response(JSON.stringify({ success: true, message: 'No messages to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const message = messages[0];
    console.log('Message type:', message.type);

    // Check if it's a button reply
    // Whapi sends button replies as type "reply" with buttons_reply inside
    const isButtonReply = message.type === 'reply' &&
                          message.reply?.type === 'buttons_reply';

    if (!isButtonReply) {
      console.log('Not a button reply, ignoring. Message type:', message.type);
      return new Response(JSON.stringify({ success: true, message: 'Not a button reply' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract button ID from the reply structure
    const buttonId = message.reply.buttons_reply.id;
    const fromPhone = message.from;

    console.log('Button pressed:', buttonId);
    console.log('From phone:', fromPhone);

    // Parse button ID to get participation_id
    // Format: ButtonsV3:absence_<participation_id>
    // We need to remove the "ButtonsV3:" prefix and "absence_" prefix
    const cleanButtonId = buttonId.replace('ButtonsV3:', '');

    if (!cleanButtonId.startsWith('absence_')) {
      console.log('Unknown button format:', buttonId);
      return new Response(JSON.stringify({ success: true, message: 'Unknown button format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const participationId = cleanButtonId.replace('absence_', '');
    console.log('Participation ID:', participationId);

    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the class participation details
    const { data: participation, error: participationError } = await supabaseClient
      .from('class_participants')
      .select(`
        id,
        student_enrollment_id,
        class_id,
        student_enrollments!inner(
          phone,
          full_name,
          email
        )
      `)
      .eq('id', participationId)
      .single();

    if (participationError || !participation) {
      console.error('Participation not found:', participationError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Participation not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Participation found for student:', (participation.student_enrollments as any).email);

    // Verify the phone number matches (security check)
    const studentPhone = (participation.student_enrollments as any).phone;
    const normalizedStudentPhone = studentPhone.replace(/\D/g, '');
    const normalizedFromPhone = fromPhone.replace(/\D/g, '');

    if (!normalizedFromPhone.includes(normalizedStudentPhone) &&
        !normalizedStudentPhone.includes(normalizedFromPhone.substring(0, 9))) {
      console.error('Phone number mismatch:', {
        student: normalizedStudentPhone,
        from: normalizedFromPhone
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone number mismatch - unauthorized'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    console.log('✓ Phone number verified');

    // Mark absence in database using raw SQL to bypass constraint
    // This constraint seems to be checking the NEW row instead of allowing updates
    console.log('📝 Calling mark_absence_from_whatsapp for:', participationId);

    const { data: updateResult, error: updateError } = await supabaseClient.rpc('mark_absence_from_whatsapp', {
      p_participation_id: participationId
    });

    if (updateError) {
      console.error('❌ Error updating absence:', updateError);
      console.error('❌ Error details:', JSON.stringify(updateError, null, 2));
      throw updateError;
    }

    console.log('✅ Absence marked successfully');
    console.log('📊 Update result:', JSON.stringify(updateResult, null, 2));

    // Send confirmation message back to user
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

    if (whapiToken) {
      try {
        const confirmationMessage = `✅ Entendido, ${(participation.student_enrollments as any).full_name}. Tu ausencia ha sido confirmada.`;

        await fetch(`${whapiEndpoint}/messages/text`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whapiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: fromPhone,
            body: confirmationMessage,
          }),
        });

        console.log('✓ Confirmation message sent');
      } catch (confirmError) {
        console.error('Error sending confirmation:', confirmError);
        // Don't fail the webhook if confirmation message fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Absence confirmed successfully',
      participationId: participationId,
      studentEmail: (participation.student_enrollments as any).email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
