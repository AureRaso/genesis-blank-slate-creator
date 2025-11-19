import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
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
        Marca tu ausencia en la app para que otra persona pueda aprovechar tu plaza. ¡Es importante!
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

    // Calculate time window: 6 hours from now
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const sevenHoursFromNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    console.log('⏰ Looking for classes between:', {
      start: sixHoursFromNow.toISOString(),
      end: sevenHoursFromNow.toISOString()
    });

    // Get today's date in YYYY-MM-DD format
    const today = now.toISOString().split('T')[0];

    // 1. Get all active programmed classes for today
    const { data: classes, error: classesError} = await supabase
      .from('programmed_classes')
      .select(`
        id,
        name,
        start_time,
        club_id,
        clubs:club_id (
          name,
          id
        )
      `)
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today);

    if (classesError) {
      throw new Error(`Error fetching classes: ${classesError.message}`);
    }

    console.log(`📚 Found ${classes?.length || 0} active classes for today`);

    if (!classes || classes.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No classes found for today',
        remindersSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Filter classes that start in ~6 hours
    const targetClasses = classes.filter(cls => {
      const [hours, minutes] = cls.start_time.split(':').map(Number);
      const classDateTime = new Date(today);
      classDateTime.setHours(hours, minutes, 0, 0);

      return classDateTime >= sixHoursFromNow && classDateTime < sevenHoursFromNow;
    });

    console.log(`🎯 Found ${targetClasses.length} classes starting in ~6 hours`);

    // Filter out cancelled classes
    const classIds = targetClasses.map(c => c.id);
    const { data: cancelledData } = await supabase
      .from('cancelled_classes')
      .select('class_id')
      .in('class_id', classIds)
      .eq('cancelled_date', today);

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

    // 2. For each target class, find participants without confirmation
    for (const classInfo of activeTargetClasses) {
      console.log(`\n📋 Processing class: ${classInfo.name} at ${classInfo.start_time}`);

      // Get participants for this class who haven't confirmed attendance
      // Note: absence_confirmed can be true (confirmed absence), false (not confirmed), or null (not confirmed)
      // We want to send reminders when:
      // - attendance_confirmed_for_date is NULL (hasn't confirmed attendance)
      // - AND absence_confirmed is NOT true (hasn't confirmed they're NOT coming)
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
        .is('attendance_confirmed_for_date', null)
        .neq('absence_confirmed', true);

      if (participantsError) {
        console.error(`❌ Error fetching participants for class ${classInfo.id}:`, participantsError);
        continue;
      }

      console.log(`👥 Found ${participants?.length || 0} participants without confirmation`);

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
          classDate: today,
          classTime: classInfo.start_time,
          clubName: (classInfo.clubs as any)?.name || '',
          confirmationLink
        });

        if (emailSent) {
          totalRemindersSent++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Job completed. Sent ${totalRemindersSent} reminder emails`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${totalRemindersSent} attendance reminder emails`,
      remindersSent: totalRemindersSent,
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
