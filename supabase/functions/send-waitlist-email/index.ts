import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWaitlistEmailRequest {
  type: 'accepted' | 'rejected';
  studentEmail: string;
  studentName: string;
  className: string;
  classDate: string;
  classTime: string;
  clubName?: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const TEST_MODE = Deno.env.get('RESEND_TEST_MODE') === 'true';
const TEST_EMAIL = 'sefaca24@gmail.com'; // Your verified email for testing
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Multi-language email content
const EMAIL_TRANSLATIONS: Record<string, {
  acceptedSubject: string;
  rejectedSubject: string;
  acceptedTitle: string;
  rejectedTitle: string;
  greeting: string;
  acceptedIntro: string;
  rejectedMessage: string;
  acceptedFooter: string;
  rejectedFooter: string;
  autoEmailNote: string;
}> = {
  es: {
    acceptedSubject: 'Ya tienes plaza en el entrenamiento',
    rejectedSubject: 'Entrenamiento completo',
    acceptedTitle: 'Ya tienes plaza',
    rejectedTitle: 'Entrenamiento completo',
    greeting: 'Hola,',
    acceptedIntro: '¡Buenas noticias! Tienes plaza en el entrenamiento:',
    rejectedMessage: 'El entrenamiento del {date} a las {time} ha quedado completo y no ha sido posible darte plaza esta vez.',
    acceptedFooter: '¡Disfruta del entreno!',
    rejectedFooter: 'Gracias por estar pendiente. ¡La siguiente te esperamos!',
    autoEmailNote: 'Este es un email automático, por favor no respondas a este mensaje.'
  },
  en: {
    acceptedSubject: 'You have a spot in the training',
    rejectedSubject: 'Training is full',
    acceptedTitle: 'You have a spot',
    rejectedTitle: 'Training is full',
    greeting: 'Hi,',
    acceptedIntro: 'Good news! You have a spot in the training:',
    rejectedMessage: 'The training on {date} at {time} is now full and we couldn\'t give you a spot this time.',
    acceptedFooter: 'Enjoy the training!',
    rejectedFooter: 'Thanks for your interest. We\'ll be waiting for you next time!',
    autoEmailNote: 'This is an automated email, please do not reply.'
  },
  it: {
    acceptedSubject: 'Hai un posto nell\'allenamento',
    rejectedSubject: 'Allenamento completo',
    acceptedTitle: 'Hai un posto',
    rejectedTitle: 'Allenamento completo',
    greeting: 'Ciao,',
    acceptedIntro: 'Buone notizie! Hai un posto nell\'allenamento:',
    rejectedMessage: 'L\'allenamento del {date} alle {time} è ora al completo e non è stato possibile darti un posto questa volta.',
    acceptedFooter: 'Goditi l\'allenamento!',
    rejectedFooter: 'Grazie per l\'interesse. Ti aspettiamo la prossima volta!',
    autoEmailNote: 'Questa è un\'email automatica, per favore non rispondere.'
  }
};

// Locale map for date formatting
const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  it: 'it-IT'
};

async function sendEmail(request: SendWaitlistEmailRequest, language: string = 'es'): Promise<boolean> {
  try {
    // In test mode, send to test email but keep original in subject for identification
    const recipientEmail = TEST_MODE ? TEST_EMAIL : request.studentEmail;
    const testPrefix = TEST_MODE ? `[TEST for ${request.studentEmail}] ` : '';

    console.log('Sending email:', {
      type: request.type,
      originalRecipient: request.studentEmail,
      actualRecipient: recipientEmail,
      testMode: TEST_MODE,
      language: language
    });

    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS['es'];
    const locale = LOCALE_MAP[language] || 'es-ES';
    const isAccepted = request.type === 'accepted';

    const subject = testPrefix + (isAccepted
      ? `${translations.acceptedSubject} 🟢`
      : translations.rejectedSubject);

    // Format date with the appropriate locale
    const dateObj = new Date(request.classDate);
    const formattedDate = dateObj.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build rejected message with date and time
    const rejectedMessage = translations.rejectedMessage
      .replace('{date}', formattedDate)
      .replace('{time}', request.classTime);

    const htmlContent = isAccepted ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${translations.acceptedSubject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🟢 ${translations.acceptedTitle}</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      ${translations.greeting} <strong>${request.studentName}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
      ${translations.acceptedIntro}
    </p>

    <div style="background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0;">
        📅 ${formattedDate}
      </p>
      <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0;">
        ⏰ ${request.classTime}
      </p>
      ${request.clubName ? `
      <p style="font-size: 16px; color: #6b7280; margin: 0;">
        🏟️ ${request.clubName} - ${request.className}
      </p>
      ` : `
      <p style="font-size: 16px; color: #6b7280; margin: 0;">
        ${request.className}
      </p>
      `}
    </div>

    <p style="font-size: 18px; font-weight: 600; color: #10b981; text-align: center; margin-top: 30px;">
      ${translations.acceptedFooter}
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>${translations.autoEmailNote}</p>
  </div>
</body>
</html>
    ` : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${translations.rejectedSubject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${translations.rejectedTitle}</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      ${translations.greeting} <strong>${request.studentName}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px; line-height: 1.8;">
      ${rejectedMessage}
    </p>

    <p style="font-size: 16px; color: #10b981; font-weight: 600; text-align: center; margin-top: 30px;">
      ${translations.rejectedFooter}
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>${translations.autoEmailNote}</p>
  </div>
</body>
</html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Padelock <info@padelock.com>',
        to: [recipientEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const responseData = await response.json();
    console.log('Resend API Response:', responseData);

    if (!response.ok) {
      console.error('Resend API Error:', responseData);
      return false;
    }

    console.log('Email sent successfully:', responseData.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SendWaitlistEmailRequest = await req.json();

    console.log('Processing email request:', {
      type: request.type,
      to: request.studentEmail,
      className: request.className
    });

    // Validate required fields
    if (!request.type || !request.studentEmail || !request.studentName ||
        !request.className || !request.classDate || !request.classTime) {
      throw new Error('Missing required fields');
    }

    // Validate email type
    if (request.type !== 'accepted' && request.type !== 'rejected') {
      throw new Error('Invalid email type. Must be "accepted" or "rejected"');
    }

    // Get club language from database
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: studentData, error: studentError } = await supabaseClient
      .from('student_enrollments')
      .select(`
        clubs!inner(default_language)
      `)
      .eq('email', request.studentEmail)
      .single();

    // Get language, fallback to Spanish if not found
    const clubLanguage = studentError || !studentData
      ? 'es'
      : (studentData.clubs as any)?.default_language || 'es';

    console.log(`Using language: ${clubLanguage} for student ${request.studentEmail}`);

    const emailSent = await sendEmail(request, clubLanguage);

    if (!emailSent) {
      throw new Error('Failed to send email');
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Email sent successfully to ${request.studentEmail}`,
      type: request.type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-waitlist-email function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
