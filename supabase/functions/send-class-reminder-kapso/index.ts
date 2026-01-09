import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassReminderRequest {
  userEmail: string;
  // New fields passed from send-attendance-reminders (pre-calculated)
  participationId?: string;
  className?: string;
  startTime?: string;
  durationMinutes?: number;
  clubName?: string;
  studentName?: string;
  testSecret?: string;
  guardianPhone?: string; // Direct phone number of guardian (for temp email students)
}

interface TomorrowClass {
  participation_id: string;
  class_name: string;
  start_time: string;
  duration_minutes: number;
  court_number: number | null;
  club_name: string;
}

// Kapso API configuration
const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY') ?? '';
const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID') ?? '';
const KAPSO_BASE_URL = Deno.env.get('KAPSO_BASE_URL') || 'https://api.kapso.ai/meta/whatsapp/v24.0';

/**
 * Format phone number for WhatsApp API (without @s.whatsapp.net)
 */
function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');

  // Add Spain country code if missing
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = '34' + digits;
  }

  return digits;
}

/**
 * Get Spanish day name from date
 */
function getSpanishDayNames(date: Date): string[] {
  const dayOfWeek = date.getDay();
  const daysMap: { [key: number]: string[] } = {
    0: ['domingo'],
    1: ['lunes'],
    2: ['martes'],
    3: ['miercoles', 'miércoles'],
    4: ['jueves'],
    5: ['viernes'],
    6: ['sabado', 'sábado']
  };
  return daysMap[dayOfWeek] || [];
}

/**
 * Calculate end time from start time and duration
 */
function calculateTimeRange(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.substring(0, 5).split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

  return `${startTime.substring(0, 5)} - ${endTime}`;
}

/**
 * Send WhatsApp template message via Kapso API
 */
async function sendKapsoTemplate(
  phone: string,
  studentName: string,
  className: string,
  timeRange: string,
  clubName: string,
  participationId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
    return { success: false, error: 'Kapso API not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  const url = `${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`;

  console.log(`📱 Sending Kapso template to: ${formattedPhone}`);
  console.log(`   Template: reminder_24h`);
  console.log(`   Params: ${studentName}, ${className}, ${timeRange}, ${clubName}`);
  console.log(`   Button payload: absence_${participationId}`);

  // Template reminder_24h has named parameters:
  // {{nombre_jugador}}, {{titulo_clase}}, {{hora_clase}}, {{nombre_club}}
  // And a quick_reply button "No puedo ir" with dynamic payload
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: "reminder_24h",
      language: { code: "es" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "nombre_jugador", text: studentName },
            { type: "text", parameter_name: "titulo_clase", text: className },
            { type: "text", parameter_name: "hora_clase", text: timeRange },
            { type: "text", parameter_name: "nombre_club", text: clubName }
          ]
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: `absence_${participationId}`
            }
          ]
        }
      ]
    }
  };

  console.log('Request body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Kapso API error:', result);
      return {
        success: false,
        error: `Kapso API error ${response.status}: ${JSON.stringify(result)}`
      };
    }

    console.log('✅ Kapso template sent successfully:', result);
    return {
      success: true,
      messageId: result.messages?.[0]?.id || result.id
    };

  } catch (error) {
    console.error('❌ Error calling Kapso API:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Class Reminder Kapso Request ===');

    const requestData: ClassReminderRequest = await req.json();
    const { userEmail, participationId, className, startTime, durationMinutes, clubName, studentName, testSecret, guardianPhone } = requestData;
    console.log('Request:', { userEmail, participationId, className, hasTestSecret: !!testSecret, hasGuardianPhone: !!guardianPhone });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedTestSecret = Deno.env.get('TEST_SECRET') || 'whatsapp-test-2025';

    if (!supabaseServiceKey) {
      throw new Error('Service configuration error');
    }

    if (testSecret && testSecret !== expectedTestSecret) {
      throw new Error('Invalid test secret');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    if (!userEmail) {
      throw new Error('Missing required field: userEmail');
    }

    // MODE 1: Direct mode - all data passed from send-attendance-reminders (no recalculation needed)
    if (participationId && className && startTime && clubName && studentName) {
      console.log('✅ Direct mode: Using pre-calculated data from cron');

      let phoneNumber: string | null = null;

      // If guardianPhone is provided (for children with temp emails), use it directly
      if (guardianPhone) {
        console.log('👨‍👩‍👧 Using guardian phone number (child with temp email)');
        phoneNumber = guardianPhone;
      } else {
        // Normal flow: Get phone number for user from student_enrollments or profiles
        const { data: studentData, error: studentError } = await supabaseClient
          .from('student_enrollments')
          .select('phone')
          .eq('email', userEmail)
          .single();

        phoneNumber = studentData?.phone;

        if (!phoneNumber) {
          console.log('⚠️ No phone in student_enrollments, checking profiles table...');
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('phone')
            .eq('email', userEmail)
            .single();
          phoneNumber = profileData?.phone;
        }
      }

      if (!phoneNumber) {
        throw new Error(`No phone number for user: ${userEmail}`);
      }

      const timeRange = calculateTimeRange(startTime, durationMinutes || 60);

      const result = await sendKapsoTemplate(
        phoneNumber,
        studentName,
        className,
        timeRange,
        clubName,
        participationId
      );

      console.log(`✓ Sent 1/1 template message (direct mode)`);

      return new Response(
        JSON.stringify({
          success: result.success,
          userEmail: userEmail,
          phone: phoneNumber,
          classesCount: 1,
          classes: [{ participation_id: participationId, class_name: className, start_time: startTime }],
          results: [{ class: className, ...result }],
          messagesSent: result.success ? 1 : 0,
          mode: 'direct'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // MODE 2: Legacy mode - calculate everything (for backwards compatibility and testing)
    console.log('⚠️ Legacy mode: Calculating classes from scratch');

    // Get student data
    const { data: studentData, error: studentError } = await supabaseClient
      .from('student_enrollments')
      .select('id, email, full_name, phone, club_id')
      .eq('email', userEmail)
      .single();

    if (studentError || !studentData) {
      throw new Error(`User not found: ${userEmail}`);
    }

    console.log('✓ Student found:', studentData.email);

    // Get club name
    const { data: clubData } = await supabaseClient
      .from('clubs')
      .select('name')
      .eq('id', studentData.club_id)
      .single();

    const legacyClubName = clubData?.name || 'Tu club';

    // If no phone in student_enrollments, try profiles table
    let phoneNumber = studentData.phone;
    if (!phoneNumber) {
      console.log('⚠️ No phone in student_enrollments, checking profiles table...');
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('phone')
        .eq('email', userEmail)
        .single();

      if (profileData?.phone) {
        phoneNumber = profileData.phone;
        console.log('✓ Phone found in profiles table:', phoneNumber);
      }
    }

    if (!phoneNumber) {
      throw new Error(`No phone number for user: ${userEmail}`);
    }

    // Get current time in Spain timezone
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' });
    const spainNow = new Date(nowStr);

    // Calculate the 24-hour window: classes starting between 24h and 24h30m from now
    // This way, with cron running every 30 min, each class gets exactly one reminder
    const twentyFourHoursFromNow = new Date(spainNow.getTime() + 24 * 60 * 60 * 1000);
    const twentyFourAndHalfHoursFromNow = new Date(spainNow.getTime() + (24 * 60 + 30) * 60 * 1000);

    // Get the target date (could be tomorrow or day after if it's late)
    const targetDate = twentyFourHoursFromNow.toISOString().split('T')[0];

    // Get target time window in HH:MM format
    const windowStartTime = `${twentyFourHoursFromNow.getHours().toString().padStart(2, '0')}:${twentyFourHoursFromNow.getMinutes().toString().padStart(2, '0')}`;
    const windowEndTime = `${twentyFourAndHalfHoursFromNow.getHours().toString().padStart(2, '0')}:${twentyFourAndHalfHoursFromNow.getMinutes().toString().padStart(2, '0')}`;

    // Get target day of week in Spanish format
    const tomorrowDayNames = getSpanishDayNames(twentyFourHoursFromNow);
    const tomorrowDateStr = targetDate;

    console.log(`⏰ Current time in Spain: ${spainNow.toLocaleString()}`);
    console.log(`🎯 Looking for classes on ${targetDate} between ${windowStartTime} and ${windowEndTime}`);
    console.log('✓ Target day is:', tomorrowDayNames.join(' or '), '- Date:', tomorrowDateStr);

    // Get participations
    const { data: participations, error: participationsError } = await supabaseClient
      .from('class_participants')
      .select('id, class_id, attendance_confirmed_at, absence_confirmed')
      .eq('student_enrollment_id', studentData.id)
      .eq('status', 'active');

    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      throw new Error('Failed to fetch participations');
    }

    if (!participations || participations.length === 0) {
      console.log('No participations found - not sending message');
      return new Response(
        JSON.stringify({
          success: true,
          userEmail: userEmail,
          phone: phoneNumber,
          classesCount: 0,
          message: 'No classes tomorrow - message not sent',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get programmed classes
    const classIds = participations.map((p: any) => p.class_id);
    const { data: programmedClasses, error: classesError } = await supabaseClient
      .from('programmed_classes')
      .select('id, name, start_time, duration_minutes, court_number, days_of_week, is_active, start_date, end_date')
      .in('id', classIds)
      .eq('is_active', true)
      .lte('start_date', tomorrowDateStr)
      .gte('end_date', tomorrowDateStr);

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      throw new Error('Failed to fetch classes');
    }

    // Filter for classes within the 24h-24h30m time window
    const tomorrowClasses: TomorrowClass[] = participations
      .map((cp: any) => {
        const pc = programmedClasses.find((c: any) => c.id === cp.class_id);
        if (!pc) return null;

        if (!pc.days_of_week) return null;

        // Check if class is scheduled for target day
        const hasMatchingDay = tomorrowDayNames.some(dayName =>
          pc.days_of_week.includes(dayName)
        );

        if (!hasMatchingDay) {
          console.log(`⏭️ Skipping ${pc.name} - not scheduled for ${tomorrowDayNames.join('/')}`);
          return null;
        }

        // Check if class time falls within the 30-minute window
        const classTime = pc.start_time.substring(0, 5); // HH:MM format
        const isInTimeWindow = classTime >= windowStartTime && classTime < windowEndTime;

        if (!isInTimeWindow) {
          console.log(`⏭️ Skipping ${pc.name} at ${classTime} - outside window ${windowStartTime}-${windowEndTime}`);
          return null;
        }

        console.log(`✅ Including ${pc.name} at ${classTime} - within 24h window`);
        return {
          participation_id: cp.id,
          class_name: pc.name,
          start_time: pc.start_time,
          duration_minutes: pc.duration_minutes,
          court_number: pc.court_number,
          club_name: legacyClubName,
        };
      })
      .filter((cls: any) => cls !== null)
      .sort((a: TomorrowClass, b: TomorrowClass) => a.start_time.localeCompare(b.start_time));

    console.log(`🎯 Found ${tomorrowClasses.length} classes starting in ~24 hours`);

    if (tomorrowClasses.length === 0) {
      console.log('No classes within 24h window - not sending message');
      return new Response(
        JSON.stringify({
          success: true,
          userEmail: userEmail,
          phone: phoneNumber,
          classesCount: 0,
          message: `No classes in window ${windowStartTime}-${windowEndTime} on ${tomorrowDateStr} - message not sent`,
          timeWindow: { start: windowStartTime, end: windowEndTime, date: tomorrowDateStr }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Send one template per class (or combine if multiple)
    // For simplicity, we'll send for the first class
    // If student has multiple classes, we send multiple messages
    const results: Array<{ class: string; success: boolean; messageId?: string; error?: string }> = [];

    for (const cls of tomorrowClasses) {
      const timeRange = calculateTimeRange(cls.start_time, cls.duration_minutes);

      const result = await sendKapsoTemplate(
        phoneNumber,
        studentData.full_name,
        cls.class_name,
        timeRange,
        cls.club_name,
        cls.participation_id
      );

      results.push({
        class: cls.class_name,
        ...result
      });

      // Delay between messages to avoid rate limiting
      if (tomorrowClasses.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✓ Sent ${successCount}/${tomorrowClasses.length} template messages`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        userEmail: userEmail,
        phone: phoneNumber,
        classesCount: tomorrowClasses.length,
        classes: tomorrowClasses,
        results: results,
        messagesSent: successCount,
        mode: 'legacy'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
