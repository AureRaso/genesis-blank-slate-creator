import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const TEST_MODE = Deno.env.get('RESEND_TEST_MODE') === 'true';
const TEST_EMAIL = 'sefaca24@gmail.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Multi-language email content for payment confirmation
const EMAIL_TRANSLATIONS: Record<string, {
  subject: string;
  title: string;
  greeting: string;
  intro: string;
  conceptLabel: string;
  amountLabel: string;
  paymentDateLabel: string;
  footer: string;
  thanks: string;
  autoEmailNote: string;
}> = {
  es: {
    subject: 'Pago confirmado',
    title: 'Pago Confirmado',
    greeting: 'Hola,',
    intro: 'Tu pago ha sido verificado correctamente:',
    conceptLabel: 'Concepto',
    amountLabel: 'Importe',
    paymentDateLabel: 'Fecha de confirmación',
    footer: 'Gracias por tu pago.',
    thanks: '¡Gracias!',
    autoEmailNote: 'Este es un email automático, por favor no respondas a este mensaje.'
  },
  en: {
    subject: 'Payment confirmed',
    title: 'Payment Confirmed',
    greeting: 'Hi,',
    intro: 'Your payment has been verified successfully:',
    conceptLabel: 'Concept',
    amountLabel: 'Amount',
    paymentDateLabel: 'Confirmation date',
    footer: 'Thank you for your payment.',
    thanks: 'Thank you!',
    autoEmailNote: 'This is an automated email, please do not reply.'
  },
  it: {
    subject: 'Pagamento confermato',
    title: 'Pagamento Confermato',
    greeting: 'Ciao,',
    intro: 'Il tuo pagamento è stato verificato con successo:',
    conceptLabel: 'Concetto',
    amountLabel: 'Importo',
    paymentDateLabel: 'Data di conferma',
    footer: 'Grazie per il tuo pagamento.',
    thanks: 'Grazie!',
    autoEmailNote: 'Questa è un\'email automatica, per favore non rispondere.'
  }
};

const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  it: 'it-IT'
};

interface SendPaymentConfirmationRequest {
  paymentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId }: SendPaymentConfirmationRequest = await req.json();

    if (!paymentId) {
      throw new Error('Missing paymentId');
    }

    console.log('Processing payment confirmation for:', paymentId);

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get payment details with student and club info
    const { data: payment, error: paymentError } = await supabaseClient
      .from('student_payments')
      .select(`
        id,
        concept,
        amount,
        admin_verified_at,
        student_enrollment:student_enrollments!inner(
          id,
          full_name,
          email,
          club_id,
          clubs!inner(
            name,
            default_language
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      throw new Error(`Error fetching payment: ${paymentError.message}`);
    }

    if (!payment) {
      throw new Error('Payment not found');
    }

    const enrollment = payment.student_enrollment as any;
    const club = enrollment.clubs;
    const language = club?.default_language || 'es';
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS['es'];
    const locale = LOCALE_MAP[language] || 'es-ES';

    const recipientEmail = TEST_MODE ? TEST_EMAIL : enrollment.email;
    const testPrefix = TEST_MODE ? `[TEST for ${enrollment.email}] ` : '';

    const confirmationDate = new Date(payment.admin_verified_at || new Date());
    const formattedDate = confirmationDate.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedAmount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(payment.amount);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${translations.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ ${translations.title}</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      ${translations.greeting} <strong>${enrollment.full_name}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
      ${translations.intro}
    </p>

    <div style="background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 10px 0;">
        <strong>${translations.conceptLabel}:</strong> ${payment.concept}
      </p>
      <p style="font-size: 20px; font-weight: bold; color: #10b981; margin: 0 0 10px 0;">
        💰 ${translations.amountLabel}: ${formattedAmount}
      </p>
      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        📅 ${translations.paymentDateLabel}: ${formattedDate}
      </p>
    </div>

    <p style="font-size: 18px; font-weight: 600; color: #10b981; text-align: center; margin-top: 30px;">
      ${translations.thanks}
    </p>

    <p style="font-size: 16px; color: #4b5563; text-align: center;">
      ${translations.footer}
    </p>

    ${club?.name ? `
    <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 20px;">
      🏟️ ${club.name}
    </p>
    ` : ''}
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>${translations.autoEmailNote}</p>
  </div>
</body>
</html>
    `;

    console.log('Sending confirmation email to:', recipientEmail);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Padelock <info@padelock.com>',
        to: [recipientEmail],
        subject: testPrefix + translations.subject + ' ✅',
        html: htmlContent,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', responseData);
      throw new Error(`Failed to send email: ${responseData.message || 'Unknown error'}`);
    }

    console.log('Confirmation email sent successfully:', responseData.id);

    return new Response(JSON.stringify({
      success: true,
      message: `Confirmation email sent to ${enrollment.email}`,
      emailId: responseData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-payment-confirmation function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
