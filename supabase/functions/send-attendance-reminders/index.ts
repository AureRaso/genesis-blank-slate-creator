import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WHATSAPP_REMINDER_URL = Deno.env.get('WHATSAPP_REMINDER_URL') ||
  'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-class-reminder-whatsapp';
const TEST_SECRET = Deno.env.get('TEST_SECRET') || 'whatsapp-test-2025';

// Club IDs with WhatsApp reminders enabled
const WHATSAPP_ENABLED_CLUBS = [
  'cc0a5265-99c5-4b99-a479-5334280d0c6d', // Gali
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport
  '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña
];

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ReminderEmailData {
  studentEmail: string;
  studentName: string;
  className: string;
  classDate: string;
  classTime: string;
  clubName: string;
  confirmationLink: string;
}

async function sendWhatsAppReminder(studentEmail: string): Promise<boolean> {
  try {
    console.log('📱 Sending WhatsApp reminder to:', studentEmail);

    const response = await fetch(WHATSAPP_REMINDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: studentEmail,
        testSecret: TEST_SECRET
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ WhatsApp reminder sent successfully');
      return true;
    } else {
      console.error('❌ WhatsApp reminder failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp reminder:', error);
    return false;
  }
}

async function sendReminderEmail(data: ReminderEmailData, retryCount = 0): Promise<boolean> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  try {
    console.log('📧 Sending reminder email to:', data.studentEmail);

    // Format date to Spanish
    const dateObj = new Date(data.classDate);
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const subject = `✅ Estás confirmado - ${data.className}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de clase</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Estás confirmado</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      Hola, <strong>${data.studentName}</strong> 👋
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
      Tu asistencia está confirmada automáticamente para tu próximo entrenamiento:
    </p>

    <div style="background-color: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #10b981;">
      <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0;">
        📅 ${formattedDate}
      </p>
      <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0;">
        ⏰ ${data.classTime}
      </p>
      <p style="font-size: 16px; color: #6b7280; margin: 0;">
        🏟️ ${data.clubName} - ${data.className}
      </p>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 5px; margin: 25px 0;">
      <p style="margin: 0 0 15px 0; color: #92400e; font-size: 16px; font-weight: 600;">
        ⚠️ ¿No puedes asistir?
      </p>
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        Marca tu ausencia en la web al menos 5 horas antes del entrenamiento para que otra persona pueda aprovechar tu plaza y tú recuperar la clase.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.confirmationLink}" style="background-color: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
        Gestionar mi asistencia
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
      Recuerda: Tu plaza está reservada. Si no puedes venir, márcalo cuanto antes.
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
        to: [data.studentEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const responseData = await response.json();
    console.log('Resend API Response:', responseData);

    if (!response.ok) {
      // Handle rate limit error (429)
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        console.warn(`⚠️ Rate limit hit for ${data.studentEmail}. Retrying in ${RETRY_DELAY}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return sendReminderEmail(data, retryCount + 1);
      }

      console.error('Resend API Error:', responseData);
      return false;
    }

    console.log('✅ Reminder email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting attendance reminder job...');

    const now = new Date();

    // Get current time in Spain timezone (Europe/Madrid)
    const spainTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' });
    const spainTime = new Date(spainTimeStr);
    const currentHour = spainTime.getHours();
    const currentMinutes = spainTime.getMinutes();

    console.log(`⏰ Current time in Spain: ${spainTime.toLocaleString()}, ${currentHour}:${currentMinutes.toString().padStart(2, '0')}`);

    // Calculate the 24-hour window: classes starting between 24h and 24h30m from now
    // This way, with cron running every 30 min, each class gets exactly one reminder
    const twentyFourHoursFromNow = new Date(spainTime.getTime() + 24 * 60 * 60 * 1000);
    const twentyFourAndHalfHoursFromNow = new Date(spainTime.getTime() + (24 * 60 + 30) * 60 * 1000);

    // Get the target date (could be tomorrow or day after if it's late)
    const targetDate = twentyFourHoursFromNow.toISOString().split('T')[0];

    // Get target time window in HH:MM format
    const windowStartTime = `${twentyFourHoursFromNow.getHours().toString().padStart(2, '0')}:${twentyFourHoursFromNow.getMinutes().toString().padStart(2, '0')}`;
    const windowEndTime = `${twentyFourAndHalfHoursFromNow.getHours().toString().padStart(2, '0')}:${twentyFourAndHalfHoursFromNow.getMinutes().toString().padStart(2, '0')}`;

    console.log(`🎯 Looking for classes on ${targetDate} between ${windowStartTime} and ${windowEndTime}`);

    // Get target day of week in Spanish format (support both accented and unaccented)
    const dayOfWeekNumber = twentyFourHoursFromNow.getDay();
    const daysMap: { [key: number]: string[] } = {
      0: ['domingo'],
      1: ['lunes'],
      2: ['martes'],
      3: ['miercoles', 'miércoles'],
      4: ['jueves'],
      5: ['viernes'],
      6: ['sabado', 'sábado']
    };
    const targetDayNames = daysMap[dayOfWeekNumber] || [];

    console.log(`📅 Target day: ${targetDate} (${targetDayNames.join(' or ')})`);

    // 1. Get all active programmed classes for tomorrow
    const { data: classes, error: classesError} = await supabase
      .from('programmed_classes')
      .select(`
        id,
        name,
        start_time,
        days_of_week,
        club_id,
        clubs:club_id (
          name,
          id
        )
      `)
      .eq('is_active', true)
      .lte('start_date', targetDate)
      .gte('end_date', targetDate);

    if (classesError) {
      throw new Error(`Error fetching classes: ${classesError.message}`);
    }

    console.log(`📚 Found ${classes?.length || 0} active classes in date range`);

    if (!classes || classes.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No classes found for tomorrow',
        remindersSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Filter classes that:
    // 1. Match target day of week (support both accented and unaccented)
    // 2. Start within the 30-minute window (24h to 24h30m from now)
    const targetClasses = classes.filter(cls => {
      const daysOfWeek = cls.days_of_week || [];

      // Check if class is scheduled for target day
      const matchesDay = targetDayNames.some((dayName: string) => daysOfWeek.includes(dayName));

      if (!matchesDay) {
        console.log(`⏭️ Skipping ${cls.name} - not scheduled for ${targetDayNames.join('/')} (scheduled for: ${daysOfWeek.join(', ')})`);
        return false;
      }

      // Check if class time falls within the 30-minute window
      const classTime = cls.start_time.substring(0, 5); // HH:MM format
      const isInTimeWindow = classTime >= windowStartTime && classTime < windowEndTime;

      if (!isInTimeWindow) {
        console.log(`⏭️ Skipping ${cls.name} at ${classTime} - outside window ${windowStartTime}-${windowEndTime}`);
        return false;
      }

      console.log(`✅ Including ${cls.name} at ${classTime} - within 24h window`);
      return true;
    });

    console.log(`🎯 Found ${targetClasses.length} classes starting in ~24 hours`);

    // Filter out cancelled classes
    const classIds = targetClasses.map(c => c.id);
    const { data: cancelledData } = await supabase
      .from('cancelled_classes')
      .select('class_id')
      .in('class_id', classIds)
      .eq('cancelled_date', targetDate);

    const cancelledClassIds = new Set(cancelledData?.map(c => c.class_id) || []);

    const activeTargetClasses = targetClasses.filter(cls => {
      if (cancelledClassIds.has(cls.id)) {
        console.log(`⏭️ Skipping cancelled class: ${cls.name} at ${cls.start_time}`);
        return false;
      }
      return true;
    });

    console.log(`📋 Processing ${activeTargetClasses.length} active classes (${cancelledClassIds.size} cancelled)`);

    let totalRemindersSent = 0;
    let totalWhatsAppSent = 0;

    // 2. For each target class, send reminders to all active participants
    for (const classInfo of activeTargetClasses) {
      console.log(`\n📋 Processing class: ${classInfo.name} at ${classInfo.start_time}`);

      // Get all active participants for this class who haven't confirmed absence
      // We send reminders to everyone who is confirmed (auto or manual) to remind them
      // We DON'T send to people who have confirmed they're NOT coming (absence_confirmed = true)
      const { data: participants, error: participantsError } = await supabase
        .from('class_participants')
        .select(`
          id,
          student_enrollment_id,
          attendance_confirmed_for_date,
          absence_confirmed,
          student_enrollment:student_enrollments!student_enrollment_id (
            id,
            full_name,
            email
          )
        `)
        .eq('class_id', classInfo.id)
        .eq('status', 'active')
        .neq('absence_confirmed', true);

      if (participantsError) {
        console.error(`❌ Error fetching participants for class ${classInfo.id}:`, participantsError);
        continue;
      }

      console.log(`👥 Found ${participants?.length || 0} participants to remind (confirmed and attending)`);

      if (!participants || participants.length === 0) {
        continue;
      }

      // 3. Send reminder email to each participant
      for (const participant of participants) {
        const enrollment = participant.student_enrollment as any;

        if (!enrollment || !enrollment.email) {
          console.warn(`⚠️ No enrollment data for participant ${participant.id}`);
          continue;
        }

        const confirmationLink = 'https://www.padelock.com/dashboard';

        const emailSent = await sendReminderEmail({
          studentEmail: enrollment.email,
          studentName: enrollment.full_name,
          className: classInfo.name,
          classDate: targetDate,
          classTime: classInfo.start_time,
          clubName: (classInfo.clubs as any)?.name || '',
          confirmationLink
        });

        if (emailSent) {
          totalRemindersSent++;
        }

        // Send WhatsApp reminder for clubs with WhatsApp enabled
        if (WHATSAPP_ENABLED_CLUBS.includes(classInfo.club_id)) {
          console.log(`📱 Sending WhatsApp to student: ${enrollment.email} (club: ${(classInfo.clubs as any)?.name})`);
          const whatsappSent = await sendWhatsAppReminder(enrollment.email);
          if (whatsappSent) {
            totalWhatsAppSent++;
          }
          // Extra delay for WhatsApp to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Delay to respect Resend rate limit (2 emails/second = 500ms between emails)
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    console.log(`\n✅ Job completed. Sent ${totalRemindersSent} reminder emails and ${totalWhatsAppSent} WhatsApp messages`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${totalRemindersSent} attendance reminder emails and ${totalWhatsAppSent} WhatsApp messages`,
      remindersSent: totalRemindersSent,
      whatsappSent: totalWhatsAppSent,
      classesProcessed: activeTargetClasses.length,
      cancelledClassesSkipped: cancelledClassIds.size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Error in send-attendance-reminders function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
