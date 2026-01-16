import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWaitlistWhatsAppRequest {
  type: 'accepted' | 'rejected';
  studentEmail: string;
  studentName: string;
  className: string;
  classDate: string;
  classTime: string;
  clubName?: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Club IDs with WhatsApp notifications enabled
const WHATSAPP_ENABLED_CLUBS: string[] = [
  'cc0a5265-99c5-4b99-a479-5334280d0c6d', // Gali
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport
  '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña
  'a994e74e-0a7f-4721-8c0f-e23100a01614', // Wild Padel Indoor
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', // Hespérides Padel
  '82608dac-fb10-422a-b158-9097d591fd57', // Finura Padel Academy
  '6fde47fc-c531-4d5e-a54a-025fcd2a4f9c', // X El Padel Lepe
  '4af50537-52b4-4f05-9770-585b4bdd337b', // Club Lora Pádel Indoor
  'b949ebbd-f65b-4e71-b793-e36fed53065e', // Soc Recreativa Huerta Jesús
];

// Multi-language message templates
const MESSAGE_TEMPLATES: Record<string, { accepted: string; rejected: string }> = {
  es: {
    accepted: `*¡Ya tienes plaza en el entrenamiento!*

Clase: {className}
Fecha: {date}
Hora: {time}
{clubLine}

¡Nos vemos en la pista!`,
    rejected: `Hola {name}!

El entrenamiento del {date} a las {time} ha quedado completo y no ha sido posible darte plaza esta vez.

Gracias por estar pendiente. *¡La siguiente te esperamos!*`
  },
  en: {
    accepted: `*You have a spot in the training!*

Class: {className}
Date: {date}
Time: {time}
{clubLine}

See you on the court!`,
    rejected: `Hi {name}!

The training on {date} at {time} is now full and we couldn't give you a spot this time.

Thanks for your interest. *We'll be waiting for you next time!*`
  },
  it: {
    accepted: `*Hai un posto nell'allenamento!*

Classe: {className}
Data: {date}
Ora: {time}
{clubLine}

Ci vediamo in campo!`,
    rejected: `Ciao {name}!

L'allenamento del {date} alle {time} è ora al completo e non è stato possibile darti un posto questa volta.

Grazie per l'interesse. *Ti aspettiamo la prossima volta!*`
  }
};

// Club line translations
const CLUB_LINE_TEMPLATES: Record<string, string> = {
  es: 'Club: {clubName}',
  en: 'Club: {clubName}',
  it: 'Club: {clubName}'
};

/**
 * Format phone number for Whapi
 */
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

/**
 * Format date to localized string
 */
function formatDateLocalized(dateStr: string, language: string): string {
  const dateObj = new Date(dateStr);
  const localeMap: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT'
  };
  const locale = localeMap[language] || 'es-ES';
  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

/**
 * Format accepted message with i18n support
 */
function formatAcceptedMessage(request: SendWaitlistWhatsAppRequest, language: string = 'es'): string {
  const formattedDate = formatDateLocalized(request.classDate, language);
  const time = request.classTime.substring(0, 5);
  const templates = MESSAGE_TEMPLATES[language] || MESSAGE_TEMPLATES['es'];
  const clubLineTemplate = CLUB_LINE_TEMPLATES[language] || CLUB_LINE_TEMPLATES['es'];

  const clubLine = request.clubName
    ? clubLineTemplate.replace('{clubName}', request.clubName)
    : '';

  return templates.accepted
    .replace('{className}', request.className)
    .replace('{date}', formattedDate)
    .replace('{time}', time)
    .replace('{clubLine}', clubLine);
}

/**
 * Format rejected message with i18n support
 */
function formatRejectedMessage(request: SendWaitlistWhatsAppRequest, language: string = 'es'): string {
  const formattedDate = formatDateLocalized(request.classDate, language);
  const time = request.classTime.substring(0, 5);
  const templates = MESSAGE_TEMPLATES[language] || MESSAGE_TEMPLATES['es'];

  return templates.rejected
    .replace('{name}', request.studentName)
    .replace('{date}', formattedDate)
    .replace('{time}', time);
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
        typing_time: 2
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SendWaitlistWhatsAppRequest = await req.json();

    console.log('Processing WhatsApp request:', {
      type: request.type,
      to: request.studentEmail,
      className: request.className
    });

    // Validate required fields
    if (!request.type || !request.studentEmail || !request.studentName ||
        !request.className || !request.classDate || !request.classTime) {
      throw new Error('Missing required fields');
    }

    // Validate type
    if (request.type !== 'accepted' && request.type !== 'rejected') {
      throw new Error('Invalid type. Must be "accepted" or "rejected"');
    }

    // Get student phone, club and language from database
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: studentData, error: studentError } = await supabaseClient
      .from('student_enrollments')
      .select(`
        phone,
        club_id,
        clubs!inner(default_language)
      `)
      .eq('email', request.studentEmail)
      .single();

    if (studentError || !studentData) {
      console.error('Student not found:', request.studentEmail);
      throw new Error(`Student not found: ${request.studentEmail}`);
    }

    // Only send WhatsApp to clubs with WhatsApp enabled
    if (!WHATSAPP_ENABLED_CLUBS.includes(studentData.club_id)) {
      console.log(`Student ${request.studentEmail} is not from a WhatsApp-enabled club - WhatsApp not sent`);
      return new Response(JSON.stringify({
        success: true,
        message: `Student not from WhatsApp-enabled club - WhatsApp not sent`,
        whatsappSent: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!studentData.phone) {
      console.log('No phone number for student:', request.studentEmail);
      return new Response(JSON.stringify({
        success: true,
        message: `No phone number for ${request.studentEmail} - WhatsApp not sent`,
        whatsappSent: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get club language, fallback to Spanish
    const clubLanguage = (studentData.clubs as any)?.default_language || 'es';
    console.log(`Using language: ${clubLanguage} for student ${request.studentEmail}`);

    // Format message based on type and language
    const message = request.type === 'accepted'
      ? formatAcceptedMessage(request, clubLanguage)
      : formatRejectedMessage(request, clubLanguage);

    // Send WhatsApp
    const messageSent = await sendWhatsAppMessage(studentData.phone, message);

    if (!messageSent) {
      throw new Error('Failed to send WhatsApp message');
    }

    // Add 30 second delay to protect account from bans
    console.log('Waiting 30 seconds before next message...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    return new Response(JSON.stringify({
      success: true,
      message: `WhatsApp sent successfully to ${request.studentEmail}`,
      type: request.type,
      whatsappSent: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-waitlist-whatsapp function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
