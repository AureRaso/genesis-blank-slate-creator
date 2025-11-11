import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

async function sendEmail(request: SendWaitlistEmailRequest): Promise<boolean> {
  try {
    // In test mode, send to test email but keep original in subject for identification
    const recipientEmail = TEST_MODE ? TEST_EMAIL : request.studentEmail;
    const testPrefix = TEST_MODE ? `[TEST for ${request.studentEmail}] ` : '';

    console.log('Sending email:', {
      type: request.type,
      originalRecipient: request.studentEmail,
      actualRecipient: recipientEmail,
      testMode: TEST_MODE
    });

    const isAccepted = request.type === 'accepted';
    const subject = testPrefix + (isAccepted
      ? `Ya tienes plaza en el entrenamiento 🟢`
      : `Entrenamiento completo`);

    // Format date to Spanish
    const dateObj = new Date(request.classDate);
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = isAccepted ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ya tienes plaza en el entrenamiento</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🟢 Ya tienes plaza</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      Hola, <strong>${request.studentName}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
      ¡Buenas noticias! Tienes plaza en el entrenamiento:
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
      ¡Disfruta del entreno!
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>Este es un email automático, por favor no respondas a este mensaje.</p>
  </div>
</body>
</html>
    ` : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrenamiento completo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Entrenamiento completo</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      Hola, <strong>${request.studentName}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px; line-height: 1.8;">
      El entrenamiento del <strong>${formattedDate}</strong> a las <strong>${request.classTime}</strong> ha quedado completo y no ha sido posible darte plaza esta vez.
    </p>

    <p style="font-size: 16px; color: #10b981; font-weight: 600; text-align: center; margin-top: 30px;">
      Gracias por estar pendiente. ¡La siguiente te esperamos!
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>Este es un email automático, por favor no respondas a este mensaje.</p>
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

    const emailSent = await sendEmail(request);

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
