import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ============================================================================
// Response messages by language
// ============================================================================

const ABSENCE_CONFIRMATION_MESSAGES: Record<string, string> = {
  'es': '✅ Entendido, {name}. Tu ausencia ha sido confirmada.',
  'en': '✅ Got it, {name}. Your absence has been confirmed.',
  'it': '✅ Capito, {name}. La tua assenza è stata confermata.',
};

const BOOKING_CONFIRMED_MESSAGES: Record<string, string> = {
  'es': '✅ Clase confirmada. El alumno ha sido notificado.',
  'en': '✅ Lesson confirmed. The student has been notified.',
  'it': '✅ Lezione confermata. Lo studente è stato notificato.',
};

const BOOKING_REJECTED_MESSAGES: Record<string, string> = {
  'es': '❌ Solicitud rechazada. El alumno ha sido notificado.',
  'en': '❌ Request rejected. The student has been notified.',
  'it': '❌ Richiesta rifiutata. Lo studente è stato notificato.',
};

const BOOKING_ALREADY_HANDLED_MESSAGES: Record<string, string> = {
  'es': 'ℹ️ Esta solicitud ya fue procesada anteriormente.',
  'en': 'ℹ️ This request has already been processed.',
  'it': 'ℹ️ Questa richiesta è già stata elaborata.',
};

// ============================================================================
// Helper: send text reply via Whapi
// ============================================================================

async function sendReplyMessage(toPhone: string, message: string): Promise<void> {
  const whapiToken = Deno.env.get('WHAPI_TOKEN');
  const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

  if (!whapiToken) return;

  try {
    await fetch(`${whapiEndpoint}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toPhone,
        body: message,
      }),
    });
    console.log('✓ Reply message sent');
  } catch (err) {
    console.error('Error sending reply:', err);
  }
}

// ============================================================================
// Handler: Absence button (existing logic)
// ============================================================================

async function handleAbsenceButton(
  cleanButtonId: string,
  fromPhone: string,
  supabaseClient: any
): Promise<Response> {
  const participationId = cleanButtonId.replace('absence_', '');
  console.log('Participation ID:', participationId);

  // Get the class participation details including club language
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
      ),
      programmed_classes!inner(
        club_id,
        clubs!inner(
          default_language
        )
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

  // Mark absence in database
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
  const clubLanguage = (participation.programmed_classes as any)?.clubs?.default_language || 'es';
  const messageTemplate = ABSENCE_CONFIRMATION_MESSAGES[clubLanguage] || ABSENCE_CONFIRMATION_MESSAGES['es'];
  const confirmationMessage = messageTemplate.replace('{name}', (participation.student_enrollments as any).full_name);

  console.log(`📱 Sending confirmation in language: ${clubLanguage}`);
  await sendReplyMessage(fromPhone, confirmationMessage);

  return new Response(JSON.stringify({
    success: true,
    message: 'Absence confirmed successfully',
    participationId: participationId,
    studentEmail: (participation.student_enrollments as any).email
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

// ============================================================================
// Handler: Booking accept/reject button
// ============================================================================

async function handleBookingButton(
  cleanButtonId: string,
  fromPhone: string,
  supabaseClient: any
): Promise<Response> {
  // Parse action and booking ID
  let action: 'confirm' | 'reject';
  let bookingId: string;

  if (cleanButtonId.startsWith('booking_accept_')) {
    action = 'confirm';
    bookingId = cleanButtonId.replace('booking_accept_', '');
  } else {
    action = 'reject';
    bookingId = cleanButtonId.replace('booking_reject_', '');
  }

  console.log(`Booking button: action=${action}, bookingId=${bookingId}`);

  // 1. Fetch booking
  const { data: booking, error: bookingError } = await supabaseClient
    .from('private_lesson_bookings')
    .select('id, status, trainer_profile_id, club_id, payment_method, stripe_payment_status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    console.error('Booking not found:', bookingId);
    return new Response(JSON.stringify({
      success: false,
      error: 'Booking not found',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });
  }

  // 2. Fetch trainer phone and verify identity
  const { data: trainerProfile } = await supabaseClient
    .from('profiles')
    .select('phone')
    .eq('id', booking.trainer_profile_id)
    .single();

  const trainerPhone = trainerProfile?.phone || '';
  const normalizedTrainerPhone = trainerPhone.replace(/\D/g, '');
  const normalizedFromPhone = fromPhone.replace(/\D/g, '');

  if (!normalizedFromPhone.includes(normalizedTrainerPhone) &&
      !normalizedTrainerPhone.includes(normalizedFromPhone.substring(0, 9))) {
    console.error('Phone mismatch for booking button:', {
      trainer: normalizedTrainerPhone,
      from: normalizedFromPhone,
    });
    return new Response(JSON.stringify({
      success: false,
      error: 'Phone number mismatch - unauthorized',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  console.log('✓ Trainer phone verified');

  // 3. Get club language for response messages
  const { data: club } = await supabaseClient
    .from('clubs')
    .select('default_language')
    .eq('id', booking.club_id)
    .single();

  const language = club?.default_language || 'es';

  // 4. Check if booking is still pending
  if (booking.status !== 'pending') {
    console.log(`Booking ${bookingId} already has status: ${booking.status}`);
    const alreadyMsg = BOOKING_ALREADY_HANDLED_MESSAGES[language] || BOOKING_ALREADY_HANDLED_MESSAGES['es'];
    await sendReplyMessage(fromPhone, alreadyMsg);

    return new Response(JSON.stringify({
      success: true,
      message: `Booking already ${booking.status}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // 5. Update booking status
  const updateData: Record<string, unknown> = {
    status: action === 'confirm' ? 'confirmed' : 'rejected',
    responded_at: new Date().toISOString(),
  };

  if (action === 'reject') {
    updateData.rejection_reason = 'Rechazado via WhatsApp';
  }

  const { error: updateError } = await supabaseClient
    .from('private_lesson_bookings')
    .update(updateData)
    .eq('id', bookingId)
    .eq('status', 'pending');

  if (updateError) {
    console.error('Error updating booking:', updateError);
    throw updateError;
  }

  console.log(`✅ Booking ${bookingId} updated to ${updateData.status}`);

  // 5.5 Handle Stripe payment capture/cancel if applicable
  if (booking.payment_method === 'stripe' && booking.stripe_payment_status === 'hold_placed') {
    try {
      const paymentAction = action === 'confirm' ? 'capture' : 'cancel';
      console.log(`Triggering payment ${paymentAction} for booking ${bookingId}`);

      await fetch(`${SUPABASE_URL}/functions/v1/manage-private-lesson-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          bookingId: bookingId,
          action: paymentAction,
        }),
      });
      console.log(`✓ Payment ${paymentAction} triggered for booking ${bookingId}`);
    } catch (paymentError) {
      console.error(`Error triggering payment ${paymentAction}:`, paymentError);
      // Don't fail the webhook — booking status is already updated
    }
  }

  // 6. Send confirmation reply to trainer
  const replyMessages = action === 'confirm'
    ? BOOKING_CONFIRMED_MESSAGES
    : BOOKING_REJECTED_MESSAGES;
  const replyMsg = replyMessages[language] || replyMessages['es'];
  await sendReplyMessage(fromPhone, replyMsg);

  // 7. Trigger student notification (fire-and-forget)
  try {
    const notifyType = action === 'confirm' ? 'confirmed' : 'rejected';
    await fetch(`${SUPABASE_URL}/functions/v1/send-private-lesson-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: notifyType,
        bookingId: bookingId,
      }),
    });
    console.log('📱 Student notification triggered');
  } catch (notifyError) {
    console.error('Error triggering student notification:', notifyError);
    // Don't fail — booking status is already updated
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Booking ${action === 'confirm' ? 'confirmed' : 'rejected'} via WhatsApp`,
    bookingId,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

// ============================================================================
// Main webhook handler
// ============================================================================

/**
 * Webhook to receive WhatsApp button responses from Whapi
 * Handles: absence buttons, booking accept/reject buttons
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== WhatsApp Webhook Received ===');

    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

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
    const isButtonReply = message.type === 'reply' &&
                          message.reply?.type === 'buttons_reply';

    if (!isButtonReply) {
      console.log('Not a button reply, ignoring. Message type:', message.type);
      return new Response(JSON.stringify({ success: true, message: 'Not a button reply' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract button ID and phone
    const buttonId = message.reply.buttons_reply.id;
    const fromPhone = message.from;

    console.log('Button pressed:', buttonId);
    console.log('From phone:', fromPhone);

    // Remove "ButtonsV3:" prefix
    const cleanButtonId = buttonId.replace('ButtonsV3:', '');

    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Route based on button ID prefix
    if (cleanButtonId.startsWith('absence_')) {
      return await handleAbsenceButton(cleanButtonId, fromPhone, supabaseClient);
    } else if (cleanButtonId.startsWith('booking_accept_') || cleanButtonId.startsWith('booking_reject_')) {
      return await handleBookingButton(cleanButtonId, fromPhone, supabaseClient);
    } else {
      console.log('Unknown button format:', buttonId);
      return new Response(JSON.stringify({ success: true, message: 'Unknown button format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

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
