import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassReminderRequest {
  userEmail: string;
  testSecret?: string;
}

interface TodayClass {
  participation_id: string;
  class_name: string;
  start_time: string;
  duration_minutes: number;
  court_number: number | null;
  attendance_confirmed_at: string | null;
  absence_confirmed: boolean;
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
 * Get Spanish day name from date
 * Returns array with both accented and unaccented versions for compatibility
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
 * Format class reminder message
 */
function formatClassMessage(studentName: string, classes: TodayClass[]): string {
  if (classes.length === 0) {
    return `Hola ${studentName}! 👋\n\nNo tienes clases programadas para mañana.\n\n¡Que tengas un buen día! 🎾`;
  }

  let message = `Hola ${studentName}! 👋\n\nRecordatorio de tus clases de mañana:\n\n`;

  classes.forEach((cls, index) => {
    message += `📍 Clase ${index + 1}: ${cls.class_name}\n`;

    // Calculate end time from start_time + duration_minutes
    const [hours, minutes] = cls.start_time.substring(0, 5).split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + cls.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    message += `⏰ Horario: ${cls.start_time.substring(0, 5)} - ${endTime}\n`;

    if (cls.court_number) {
      message += `🎾 Pista: ${cls.court_number}\n`;
    }

    if (cls.attendance_confirmed_at) {
      message += `✅ Asistencia confirmada\n`;
    } else if (cls.absence_confirmed) {
      message += `❌ Ausencia confirmada\n`;
    } else {
      message += `⚠️ Pendiente de confirmar\n`;
    }

    message += `\n`;
  });

  message += `⚠️ Recuerda: Si no puedes asistir, márcalo en la web antes de 5 horas del inicio de la clase.\n\n`;
  message += `🔗 Accede aquí: https://www.padelock.com/auth\n\n`;
  message += `¡Nos vemos en la pista! 🎾`;

  return message;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Class Reminder WhatsApp Request ===');

    const { userEmail, testSecret }: ClassReminderRequest = await req.json();
    console.log('Request:', { userEmail, hasTestSecret: !!testSecret });

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

    // Get student data
    const { data: studentData, error: studentError } = await supabaseClient
      .from('student_enrollments')
      .select('id, email, full_name, phone')
      .eq('email', userEmail)
      .single();

    if (studentError || !studentData) {
      throw new Error(`User not found: ${userEmail}`);
    }

    console.log('✓ Student found:', studentData.email);

    if (!studentData.phone) {
      throw new Error(`No phone number for user: ${userEmail}`);
    }

    // Get tomorrow's date and day names in Spanish (for 24h advance reminder)
    // Using Spain timezone for accurate date calculation
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' });
    const spainNow = new Date(nowStr);
    const tomorrow = new Date(spainNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayNames = getSpanishDayNames(tomorrow);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('✓ Tomorrow is:', tomorrowDayNames.join(' or '), '- Date:', tomorrowDateStr);

    // Get tomorrow's classes for this student using a raw query approach
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
          phone: studentData.phone,
          classesCount: 0,
          classes: [],
          message: 'No classes tomorrow - message not sent',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get programmed classes details - filter by is_active AND date range
    const classIds = participations.map((p: any) => p.class_id);
    const { data: programmedClasses, error: classesError } = await supabaseClient
      .from('programmed_classes')
      .select('id, name, start_time, duration_minutes, court_number, days_of_week, is_active, start_date, end_date')
      .in('id', classIds)
      .eq('is_active', true)
      .lte('start_date', tomorrowDateStr)  // Class must have started by tomorrow
      .gte('end_date', tomorrowDateStr);   // Class must not have ended before tomorrow

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      throw new Error('Failed to fetch classes');
    }

    // Combine data and filter for tomorrow
    const tomorrowClasses: TodayClass[] = participations
      .map((cp: any) => {
        const pc = programmedClasses.find((c: any) => c.id === cp.class_id);
        if (!pc) return null;

        // Check if class happens tomorrow (support both accented and unaccented)
        if (!pc.days_of_week) return null;

        const hasMatchingDay = tomorrowDayNames.some(dayName =>
          pc.days_of_week.includes(dayName)
        );

        if (!hasMatchingDay) {
          return null;
        }

        return {
          participation_id: cp.id,
          class_name: pc.name,
          start_time: pc.start_time,
          duration_minutes: pc.duration_minutes,
          court_number: pc.court_number,
          attendance_confirmed_at: cp.attendance_confirmed_at,
          absence_confirmed: cp.absence_confirmed,
        };
      })
      .filter((cls: any) => cls !== null)
      .sort((a: TodayClass, b: TodayClass) => a.start_time.localeCompare(b.start_time));

    console.log(`✓ Found ${tomorrowClasses.length} classes for tomorrow`);

    // If no classes for tomorrow, don't send message
    if (tomorrowClasses.length === 0) {
      console.log('No classes for tomorrow - not sending message');
      return new Response(
        JSON.stringify({
          success: true,
          userEmail: userEmail,
          phone: studentData.phone,
          classesCount: 0,
          classes: [],
          message: 'No classes tomorrow - message not sent',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Format message
    const message = formatClassMessage(studentData.full_name, tomorrowClasses);
    console.log('✓ Message formatted');

    // Format phone and send WhatsApp
    const formattedPhone = formatPhoneNumber(studentData.phone);
    console.log('✓ Phone formatted:', formattedPhone);

    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

    if (!whapiToken) {
      throw new Error('WHAPI_TOKEN not configured');
    }

    // Build interactive buttons - one button per class for absence confirmation
    const buttons = tomorrowClasses.slice(0, 3).map((cls, index) => ({
      type: 'quick_reply',
      id: `absence_${cls.participation_id}`,
      title: `❌ No puedo ir (${index + 1})`
    }));

    // Send interactive message with buttons
    const response = await fetch(`${whapiEndpoint}/messages/interactive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        type: 'button',
        body: {
          text: message
        },
        action: {
          buttons: buttons
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whapi error response:', errorText);
      console.error('Request body was:', JSON.stringify({
        to: formattedPhone,
        type: 'button',
        body: { text: message },
        action: { buttons: buttons }
      }, null, 2));
      throw new Error(`Whapi API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✓ WhatsApp interactive message sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        userEmail: userEmail,
        phone: studentData.phone,
        formattedPhone: formattedPhone,
        classesCount: tomorrowClasses.length,
        classes: tomorrowClasses,
        message: message,
        messageId: result.id || result.message_id,
        data: result
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
