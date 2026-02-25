import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendPrivateLessonWhatsAppRequest {
  type: 'confirmed' | 'rejected';
  bookingId: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Club IDs with WhatsApp notifications enabled (same as send-waitlist-whatsapp)
const WHATSAPP_ENABLED_CLUBS: string[] = [
  'cc0a5265-99c5-4b99-a479-5334280d0c6d', // Gali
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport
  '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña
  'a994e74e-0a7f-4721-8c0f-e23100a01614', // Wild Padel Indoor
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', // Hespérides Padel
  '6fde47fc-c531-4d5e-a54a-025fcd2a4f9c', // X El Padel Lepe
  '4af50537-52b4-4f05-9770-585b4bdd337b', // Club Lora Pádel Indoor
  'b949ebbd-f65b-4e71-b793-e36fed53065e', // Soc Recreativa Huerta Jesús
  'e4ca00ff-63af-4d8c-a5bf-db67bc382c6a', // Sportres Padel Academy
  'bdc107d7-4cd8-4586-ab49-fa489ab27794', // Leyon NM pádel Academy
  '190cfb4c-d923-49d8-bb75-93bbda82f97d', // Matchpadel Academy Matchpadel
  'ec23d10f-0a14-4699-a50d-87c5e65d6417', // Matchpadel Academy Solopadel
  '3f71d96e-defe-4395-9f03-46dca0577f45', // Pádel Pibo
  '0fb97f06-0c84-4559-874c-4b63124f7e8f', // Iron X Deluxe
  'd2265a22-fc1e-4f63-bd90-a78e6475bce4', // R2 Pádel Itálica
  'b0fc8417-a9dc-4c7c-8a1a-0f6a7714588a', // Rico Pádel
  '6dbcc136-1fe3-4755-957a-6e9a35d29574', // IBL Padel Academy
  'c62db1b4-5c0f-4c1d-8d11-1905dd0512a8', // Escuela Soydepadel
];

// ============================================================================
// Multi-language message templates
// ============================================================================

const CONFIRMED_BOOKER_TEMPLATES: Record<string, string> = {
  es: `¡Todo listo! ✅

Tienes una clase particular confirmada con {trainerName} el {date} ({startTime} - {endTime}) en {clubName}.

Tarifa: {pricePerPerson}€/persona

_Nota: Recuerda realizar el pago antes de acudir a la pista._

¡Disfruta del entrenamiento!`,
  en: `You're all set! ✅

You have a confirmed lesson with {trainerName} this {date} ({startTime} - {endTime}) at {clubName}.

Rate: {pricePerPerson}€/person

_Note: Please remember to process your payment before heading to the court._

Enjoy your training!`,
  it: `Tutto pronto! ✅

Hai una lezione privata confermata con {trainerName} il {date} ({startTime} - {endTime}) presso {clubName}.

Tariffa: {pricePerPerson}€/persona

_Nota: Ricorda di effettuare il pagamento prima di recarti in campo._

Buon allenamento!`,
};

const CONFIRMED_COMPANION_TEMPLATES: Record<string, string> = {
  es: `¡Todo listo! ✅

{bookerName} ha reservado una clase particular para ti con {trainerName} el {date} ({startTime} - {endTime}) en {clubName}.

Tarifa: {pricePerPerson}€/persona

_Nota: Recuerda realizar el pago antes de acudir a la pista._

¡Disfruta del entrenamiento!`,
  en: `You're all set! ✅

{bookerName} has booked a lesson for you with {trainerName} this {date} ({startTime} - {endTime}) at {clubName}.

Rate: {pricePerPerson}€/person

_Note: Please remember to process your payment before heading to the court._

Enjoy your training!`,
  it: `Tutto pronto! ✅

{bookerName} ha prenotato una lezione per te con {trainerName} il {date} ({startTime} - {endTime}) presso {clubName}.

Tariffa: {pricePerPerson}€/persona

_Nota: Ricorda di effettuare il pagamento prima di recarti in campo._

Buon allenamento!`,
};

const REJECTED_TEMPLATES: Record<string, string> = {
  es: `Hola {name},

Tu solicitud de clase particular del {date} a las {startTime} con {trainerName} no ha podido ser aceptada.
{rejectionReasonLine}
Puedes solicitar otra hora disponible en la app.`,
  en: `Hi {name},

Your private lesson request for {date} at {startTime} with {trainerName} could not be accepted.
{rejectionReasonLine}
You can request another available time in the app.`,
  it: `Ciao {name},

La tua richiesta di lezione privata del {date} alle {startTime} con {trainerName} non è stata accettata.
{rejectionReasonLine}
Puoi richiedere un altro orario disponibile nell'app.`,
};

const REJECTION_REASON_PREFIX: Record<string, string> = {
  es: 'Motivo: ',
  en: 'Reason: ',
  it: 'Motivo: ',
};

// ============================================================================
// Utility functions (same as send-waitlist-whatsapp)
// ============================================================================

function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');

  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = '34' + digits;
  }

  if (!phone.includes('@')) {
    return `${digits}@s.whatsapp.net`;
  }

  return phone;
}

function formatDateLocalized(dateStr: string, language: string): string {
  const dateObj = new Date(dateStr + 'T12:00:00');
  const localeMap: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT',
  };
  const locale = localeMap[language] || 'es-ES';
  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const whapiToken = Deno.env.get('WHAPI_TOKEN');
  const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

  if (!whapiToken) {
    console.error('WHAPI_TOKEN not configured');
    return false;
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);
    console.log('Sending WhatsApp to:', formattedPhone);

    const response = await fetch(`${whapiEndpoint}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: message,
        typing_time: 2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whapi error:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result.id || result.message_id);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// ============================================================================
// Message formatting
// ============================================================================

interface BookingData {
  booker_name: string;
  booker_phone: string | null;
  lesson_date: string;
  start_time: string;
  end_time: string;
  price_per_person: number | null;
  rejection_reason: string | null;
  companion_details: { name: string; profile_id: string }[];
  trainerName: string;
  clubName: string;
}

function formatConfirmedBookerMessage(booking: BookingData, language: string): string {
  const template = CONFIRMED_BOOKER_TEMPLATES[language] || CONFIRMED_BOOKER_TEMPLATES['es'];
  const date = formatDateLocalized(booking.lesson_date, language);

  return template
    .replace('{trainerName}', booking.trainerName)
    .replace('{date}', date)
    .replace('{startTime}', booking.start_time.substring(0, 5))
    .replace('{endTime}', booking.end_time.substring(0, 5))
    .replace('{pricePerPerson}', String(booking.price_per_person ?? 0))
    .replace('{clubName}', booking.clubName);
}

function formatConfirmedCompanionMessage(booking: BookingData, language: string): string {
  const template = CONFIRMED_COMPANION_TEMPLATES[language] || CONFIRMED_COMPANION_TEMPLATES['es'];
  const date = formatDateLocalized(booking.lesson_date, language);

  return template
    .replace('{bookerName}', booking.booker_name)
    .replace('{trainerName}', booking.trainerName)
    .replace('{date}', date)
    .replace('{startTime}', booking.start_time.substring(0, 5))
    .replace('{endTime}', booking.end_time.substring(0, 5))
    .replace('{pricePerPerson}', String(booking.price_per_person ?? 0))
    .replace('{clubName}', booking.clubName);
}

function formatRejectedMessage(booking: BookingData, language: string): string {
  const template = REJECTED_TEMPLATES[language] || REJECTED_TEMPLATES['es'];
  const date = formatDateLocalized(booking.lesson_date, language);
  const prefix = REJECTION_REASON_PREFIX[language] || REJECTION_REASON_PREFIX['es'];

  const rejectionReasonLine = booking.rejection_reason
    ? `${prefix}${booking.rejection_reason}\n`
    : '';

  return template
    .replace('{name}', booking.booker_name)
    .replace('{date}', date)
    .replace('{startTime}', booking.start_time.substring(0, 5))
    .replace('{trainerName}', booking.trainerName)
    .replace('{rejectionReasonLine}', rejectionReasonLine);
}

// ============================================================================
// Main handler
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SendPrivateLessonWhatsAppRequest = await req.json();

    console.log('Processing private lesson WhatsApp:', {
      type: request.type,
      bookingId: request.bookingId,
    });

    if (!request.type || !request.bookingId) {
      throw new Error('Missing required fields: type, bookingId');
    }

    if (request.type !== 'confirmed' && request.type !== 'rejected') {
      throw new Error('Invalid type. Must be "confirmed" or "rejected"');
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('private_lesson_bookings')
      .select('booker_name, booker_phone, lesson_date, start_time, end_time, duration_minutes, price_per_person, total_price, num_companions, companion_details, rejection_reason, club_id, trainer_profile_id')
      .eq('id', request.bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${request.bookingId}`);
    }

    // 2. Check club whitelist
    if (!WHATSAPP_ENABLED_CLUBS.includes(booking.club_id)) {
      console.log(`Club ${booking.club_id} not in WhatsApp whitelist — skipping`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Club not WhatsApp-enabled',
        whatsappSent: false,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch trainer name
    const { data: trainerProfile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', booking.trainer_profile_id)
      .single();

    const trainerName = trainerProfile?.full_name || 'Entrenador';

    // 4. Fetch club name + language
    const { data: club } = await supabaseClient
      .from('clubs')
      .select('name, default_language')
      .eq('id', booking.club_id)
      .single();

    const clubName = club?.name || '';
    const language = club?.default_language || 'es';

    // Build booking data for message formatting
    const companions = Array.isArray(booking.companion_details)
      ? booking.companion_details as { name: string; profile_id: string }[]
      : [];

    const bookingData: BookingData = {
      booker_name: booking.booker_name,
      booker_phone: booking.booker_phone,
      lesson_date: booking.lesson_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      price_per_person: booking.price_per_person,
      rejection_reason: booking.rejection_reason,
      companion_details: companions,
      trainerName,
      clubName,
    };

    let messagesSent = 0;

    // 5. Send to booker
    if (booking.booker_phone) {
      const message = request.type === 'confirmed'
        ? formatConfirmedBookerMessage(bookingData, language)
        : formatRejectedMessage(bookingData, language);

      const sent = await sendWhatsAppMessage(booking.booker_phone, message);
      if (sent) messagesSent++;

      // Anti-ban delay
      if (companions.length > 0 && request.type === 'confirmed') {
        console.log('Waiting 30 seconds before next message...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } else {
      console.log(`No phone for booker ${booking.booker_name} — skipping`);
    }

    // 6. Send to companions (only on confirmation)
    if (request.type === 'confirmed' && companions.length > 0) {
      const companionProfileIds = companions
        .map(c => c.profile_id)
        .filter(Boolean);

      if (companionProfileIds.length > 0) {
        const { data: companionProfiles } = await supabaseClient
          .from('profiles')
          .select('id, phone, full_name')
          .in('id', companionProfileIds);

        const companionMessage = formatConfirmedCompanionMessage(bookingData, language);

        for (const companion of companionProfiles || []) {
          if (!companion.phone) {
            console.log(`No phone for companion ${companion.full_name} — skipping`);
            continue;
          }

          const sent = await sendWhatsAppMessage(companion.phone, companionMessage);
          if (sent) messagesSent++;

          // Anti-ban delay between companions
          console.log('Waiting 30 seconds before next message...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }

    console.log(`Private lesson WhatsApp: ${messagesSent} messages sent for booking ${request.bookingId}`);

    return new Response(JSON.stringify({
      success: true,
      type: request.type,
      messagesSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-private-lesson-whatsapp:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
