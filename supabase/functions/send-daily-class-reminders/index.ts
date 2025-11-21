import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyRemindersRequest {
  testSecret?: string;
  clubId?: string; // Optional: to test with specific club
}

/**
 * Get Spanish day name from date
 */
function getSpanishDayName(date: Date): string {
  const dayOfWeek = date.getDay();
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[dayOfWeek];
}

/**
 * Get tomorrow's date and day name
 */
function getTomorrowInfo() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    date: tomorrow,
    dayName: getSpanishDayName(tomorrow)
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Daily Class Reminders Job Started ===');

    const { testSecret, clubId }: DailyRemindersRequest = await req.json().catch(() => ({}));
    const expectedTestSecret = Deno.env.get('TEST_SECRET') || 'whatsapp-test-2025';

    if (testSecret && testSecret !== expectedTestSecret) {
      throw new Error('Invalid test secret');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const reminderFunctionUrl = Deno.env.get('REMINDER_FUNCTION_URL') ||
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-class-reminder-whatsapp';

    if (!supabaseServiceKey) {
      throw new Error('Service configuration error');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's day name
    const { dayName: tomorrowDayName } = getTomorrowInfo();
    console.log('✓ Tomorrow is:', tomorrowDayName);

    // Get target club (Gali for testing)
    const targetClubId = clubId || 'cc0a5265-99c5-4b99-a479-5334280d0c6d'; // Gali club ID

    // Get all active classes for tomorrow
    const { data: programmedClasses, error: classesError } = await supabaseClient
      .from('programmed_classes')
      .select('id, name, start_time, club_id')
      .eq('club_id', targetClubId)
      .eq('is_active', true);

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      throw new Error('Failed to fetch classes');
    }

    // Filter classes that happen tomorrow
    const tomorrowClasses = programmedClasses.filter((pc: any) =>
      pc.days_of_week && pc.days_of_week.includes(tomorrowDayName)
    );

    console.log(`✓ Found ${tomorrowClasses.length} classes for tomorrow`);

    if (tomorrowClasses.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No classes scheduled for tomorrow',
          classesCount: 0,
          remindersSent: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get all class IDs
    const classIds = tomorrowClasses.map((c: any) => c.id);

    // Get all active participants for these classes
    const { data: participants, error: participantsError } = await supabaseClient
      .from('class_participants')
      .select('student_enrollment_id, class_id')
      .in('class_id', classIds)
      .eq('status', 'active');

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      throw new Error('Failed to fetch participants');
    }

    console.log(`✓ Found ${participants.length} participants to notify`);

    // Get unique student IDs
    const studentIds = [...new Set(participants.map((p: any) => p.student_enrollment_id))];

    // Get student details
    const { data: students, error: studentsError } = await supabaseClient
      .from('student_enrollments')
      .select('id, email, full_name, phone')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw new Error('Failed to fetch students');
    }

    console.log(`✓ Found ${students.length} students to notify`);

    // Send reminders to each student
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const student of students) {
      if (!student.phone) {
        console.log(`⚠ Skipping ${student.email}: no phone number`);
        results.push({
          email: student.email,
          success: false,
          reason: 'No phone number'
        });
        failureCount++;
        continue;
      }

      try {
        console.log(`📤 Sending reminder to ${student.email}...`);

        const response = await fetch(reminderFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: student.email,
            testSecret: expectedTestSecret
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log(`✓ Reminder sent to ${student.email}`);
          results.push({
            email: student.email,
            success: true,
            classesCount: result.classesCount
          });
          successCount++;
        } else {
          console.error(`✗ Failed to send to ${student.email}:`, result.error);
          results.push({
            email: student.email,
            success: false,
            reason: result.error
          });
          failureCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

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

    console.log('=== Daily Class Reminders Job Completed ===');
    console.log(`Success: ${successCount}, Failures: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily reminders job completed',
        tomorrowDay: tomorrowDayName,
        classesCount: tomorrowClasses.length,
        studentsCount: students.length,
        remindersSent: successCount,
        remindersFailed: failureCount,
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
