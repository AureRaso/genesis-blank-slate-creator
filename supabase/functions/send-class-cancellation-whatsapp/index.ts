import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancellationRequest {
  classId: string;
  cancelledDate: string;
  className: string;
  classTime: string;
  reason?: string;
}

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
 * Format date in Spanish
 */
function formatDateInSpanish(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Format cancellation message
 */
function formatCancellationMessage(studentName: string, className: string, classDate: string, classTime: string, reason?: string): string {
  const formattedDate = formatDateInSpanish(classDate);
  const formattedTime = classTime.substring(0, 5);

  let message = `Hola ${studentName},

Tu clase ha sido cancelada:

📍 ${className}
📅 ${formattedDate}
⏰ ${formattedTime}

Lamentamos los inconvenientes.`;

  if (reason) {
    message += `\n\n📝 Motivo: ${reason}`;
  }

  message += `\n\n¿Dudas? Contacta con tu club.`;

  return message;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Class Cancellation WhatsApp Notification ===');

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseServiceKey) {
      throw new Error('Service configuration error');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized: Invalid token');
    }
    console.log('✓ User authenticated:', user.email);

    // Parse request body
    const { classId, cancelledDate, className, classTime, reason }: CancellationRequest = await req.json();
    console.log('Request:', { classId, cancelledDate, className, classTime, reason });

    if (!classId || !cancelledDate || !className || !classTime) {
      throw new Error('Missing required fields: classId, cancelledDate, className, classTime');
    }

    // Get all active participants for this class
    const { data: participants, error: participantsError } = await supabaseClient
      .from('class_participants')
      .select(`
        id,
        student_enrollment_id,
        student_enrollments!inner(
          id,
          full_name,
          phone,
          email
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active');

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      throw new Error('Failed to fetch participants');
    }

    console.log(`✓ Found ${participants?.length || 0} participants`);

    if (!participants || participants.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No participants to notify',
          notificationsSent: 0,
          notificationsFailed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get Whapi credentials
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

    if (!whapiToken) {
      throw new Error('WHAPI_TOKEN not configured');
    }

    // Send notifications to each participant
    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const participant of participants) {
      const student = (participant as any).student_enrollments;

      if (!student?.phone) {
        console.log(`⚠ Skipping ${student?.email || 'unknown'}: no phone number`);
        results.push({
          email: student?.email,
          success: false,
          reason: 'No phone number'
        });
        failureCount++;
        continue;
      }

      try {
        const message = formatCancellationMessage(
          student.full_name,
          className,
          cancelledDate,
          classTime,
          reason
        );

        const formattedPhone = formatPhoneNumber(student.phone);
        console.log(`📤 Sending cancellation to ${student.email} (${formattedPhone})...`);

        const response = await fetch(`${whapiEndpoint}/messages/text`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whapiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: formattedPhone,
            body: message,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`✗ Whapi error for ${student.email}:`, errorText);
          results.push({
            email: student.email,
            success: false,
            reason: `Whapi error: ${response.status}`
          });
          failureCount++;
        } else {
          const result = await response.json();
          console.log(`✓ Notification sent to ${student.email}`);
          results.push({
            email: student.email,
            success: true,
            messageId: result.id || result.message_id
          });
          successCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`✗ Error sending to ${student.email}:`, error);
        results.push({
          email: student.email,
          success: false,
          reason: error.message
        });
        failureCount++;
      }
    }

    console.log('=== Cancellation Notifications Completed ===');
    console.log(`Success: ${successCount}, Failures: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cancellation notifications sent',
        notificationsSent: successCount,
        notificationsFailed: failureCount,
        totalParticipants: participants.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);

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
