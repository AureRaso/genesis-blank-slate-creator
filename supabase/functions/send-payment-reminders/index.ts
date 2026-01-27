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

// Multi-language email content for payment reminders
const EMAIL_TRANSLATIONS: Record<string, {
  subject: string;
  title: string;
  greeting: string;
  intro: string;
  conceptLabel: string;
  amountLabel: string;
  dueDateLabel: string;
  buttonText: string;
  footer: string;
  autoEmailNote: string;
}> = {
  es: {
    subject: 'Recordatorio de pago próximo',
    title: 'Recordatorio de Pago',
    greeting: 'Hola,',
    intro: 'Te recordamos que tienes un pago próximo a vencer:',
    conceptLabel: 'Concepto',
    amountLabel: 'Importe',
    dueDateLabel: 'Fecha de vencimiento',
    buttonText: 'Notificar pago',
    footer: 'Por favor, realiza el pago antes de la fecha indicada para evitar retrasos.',
    autoEmailNote: 'Este es un email automático, por favor no respondas a este mensaje.'
  },
  en: {
    subject: 'Payment reminder',
    title: 'Payment Reminder',
    greeting: 'Hi,',
    intro: 'This is a reminder that you have an upcoming payment:',
    conceptLabel: 'Concept',
    amountLabel: 'Amount',
    dueDateLabel: 'Due date',
    buttonText: 'Notify payment',
    footer: 'Please make your payment before the due date to avoid delays.',
    autoEmailNote: 'This is an automated email, please do not reply.'
  },
  it: {
    subject: 'Promemoria di pagamento',
    title: 'Promemoria di Pagamento',
    greeting: 'Ciao,',
    intro: 'Ti ricordiamo che hai un pagamento in scadenza:',
    conceptLabel: 'Concetto',
    amountLabel: 'Importo',
    dueDateLabel: 'Data di scadenza',
    buttonText: 'Notifica pagamento',
    footer: 'Per favore, effettua il pagamento entro la data indicata per evitare ritardi.',
    autoEmailNote: 'Questa è un\'email automatica, per favore non rispondere.'
  }
};

const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  it: 'it-IT'
};

interface PaymentToRemind {
  id: string;
  concept: string;
  amount: number;
  due_date: string;
  student_enrollment: {
    id: string;
    full_name: string;
    email: string;
    club_id: string;
  };
  club: {
    name: string;
    default_language: string;
  };
}

async function sendReminderEmail(payment: PaymentToRemind): Promise<boolean> {
  try {
    const language = payment.club?.default_language || 'es';
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS['es'];
    const locale = LOCALE_MAP[language] || 'es-ES';

    const recipientEmail = TEST_MODE ? TEST_EMAIL : payment.student_enrollment.email;
    const testPrefix = TEST_MODE ? `[TEST for ${payment.student_enrollment.email}] ` : '';

    const dateObj = new Date(payment.due_date);
    const formattedDate = dateObj.toLocaleDateString(locale, {
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
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ ${translations.title}</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      ${translations.greeting} <strong>${payment.student_enrollment.full_name}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
      ${translations.intro}
    </p>

    <div style="background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 10px 0;">
        <strong>${translations.conceptLabel}:</strong> ${payment.concept}
      </p>
      <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">
        💰 ${translations.amountLabel}: ${formattedAmount}
      </p>
      <p style="font-size: 16px; color: #dc2626; font-weight: 600; margin: 0;">
        📅 ${translations.dueDateLabel}: ${formattedDate}
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.padelock.com/dashboard/my-payments"
         style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        ${translations.buttonText} →
      </a>
    </div>

    <p style="font-size: 16px; color: #4b5563; text-align: center; margin-top: 20px;">
      ${translations.footer}
    </p>

    ${payment.club?.name ? `
    <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 20px;">
      🏟️ ${payment.club.name}
    </p>
    ` : ''}
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
        subject: testPrefix + translations.subject + ' 📬',
        html: htmlContent,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', responseData);
      return false;
    }

    console.log('Reminder email sent successfully:', responseData.id);
    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this is a test request for a specific payment
    let testPaymentId: string | null = null;
    let testMode = false;

    try {
      const body = await req.json();
      if (body.paymentId) {
        testPaymentId = body.paymentId;
        testMode = body.testMode === true; // Don't update reminder_sent_at if testMode
      }
    } catch {
      // No body or invalid JSON - normal cron execution
    }

    let payments;
    let paymentsError;

    if (testPaymentId) {
      // Test mode: get specific payment regardless of due date
      console.log(`Test mode: sending reminder for payment ${testPaymentId}`);

      const result = await supabaseClient
        .from('student_payments')
        .select(`
          id,
          concept,
          amount,
          due_date,
          student_enrollment:student_enrollments!inner(
            id,
            full_name,
            email,
            club_id
          )
        `)
        .eq('id', testPaymentId)
        .single();

      payments = result.data ? [result.data] : [];
      paymentsError = result.error;
    } else {
      // Normal mode: Calculate date range: 6-8 days from now (to account for daily cron timing)
      const now = new Date();
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() + 6);
      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() + 8);

      const minDateStr = minDate.toISOString().split('T')[0];
      const maxDateStr = maxDate.toISOString().split('T')[0];

      console.log(`Looking for payments due between ${minDateStr} and ${maxDateStr}`);

      // Get pending payments that haven't been reminded yet
      const result = await supabaseClient
        .from('student_payments')
        .select(`
          id,
          concept,
          amount,
          due_date,
          student_enrollment:student_enrollments!inner(
            id,
            full_name,
            email,
            club_id
          )
        `)
        .eq('status', 'pendiente')
        .is('reminder_sent_at', null)
        .gte('due_date', minDateStr)
        .lte('due_date', maxDateStr);

      payments = result.data;
      paymentsError = result.error;
    }

    if (paymentsError) {
      throw new Error(`Error fetching payments: ${paymentsError.message}`);
    }

    if (!payments || payments.length === 0) {
      console.log('No payments to remind');
      return new Response(JSON.stringify({
        success: true,
        message: 'No payments to remind',
        sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${payments.length} payments to remind`);

    // Get club info for each unique club
    const clubIds = [...new Set(payments.map(p => (p.student_enrollment as any).club_id))];
    const { data: clubs, error: clubsError } = await supabaseClient
      .from('clubs')
      .select('id, name, default_language')
      .in('id', clubIds);

    if (clubsError) {
      throw new Error(`Error fetching clubs: ${clubsError.message}`);
    }

    const clubMap = new Map(clubs?.map(c => [c.id, c]) || []);

    let sent = 0;
    let failed = 0;

    for (const payment of payments) {
      const enrollment = payment.student_enrollment as any;
      const club = clubMap.get(enrollment.club_id);

      const paymentData: PaymentToRemind = {
        id: payment.id,
        concept: payment.concept,
        amount: payment.amount,
        due_date: payment.due_date,
        student_enrollment: {
          id: enrollment.id,
          full_name: enrollment.full_name,
          email: enrollment.email,
          club_id: enrollment.club_id,
        },
        club: {
          name: club?.name || '',
          default_language: club?.default_language || 'es',
        }
      };

      const emailSent = await sendReminderEmail(paymentData);

      if (emailSent) {
        // Mark as reminded to prevent duplicates (unless in test mode)
        if (!testMode) {
          const { error: updateError } = await supabaseClient
            .from('student_payments')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', payment.id);

          if (updateError) {
            console.error(`Error updating reminder_sent_at for payment ${payment.id}:`, updateError);
          }
        }
        sent++;
      } else {
        failed++;
      }

      // Rate limiting: wait 500ms between emails
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Reminders sent: ${sent}, failed: ${failed}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${sent} reminder emails`,
      sent,
      failed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-payment-reminders function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
