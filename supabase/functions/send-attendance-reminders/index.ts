import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TEST_SECRET = Deno.env.get('TEST_SECRET') || 'whatsapp-test-2025';

// WhatsApp reminder URLs - Kapso (new) vs Whapi (legacy)
const KAPSO_REMINDER_URL = Deno.env.get('KAPSO_REMINDER_URL') ||
  'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-class-reminder-kapso';
const WHAPI_REMINDER_URL = Deno.env.get('WHATSAPP_REMINDER_URL') ||
  'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-class-reminder-whatsapp';

// Club IDs with WhatsApp reminders enabled via KAPSO (new system with templates)
const KAPSO_ENABLED_CLUBS: string[] = [
  '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy - TEST CLUB FOR KAPSO
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', // Hespérides Padel
  'a994e74e-0a7f-4721-8c0f-e23100a01614', // Wild Padel Indoor
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña
  // '82608dac-fb10-422a-b158-9097d591fd57', // Finura Padel Academy - PAUSED
  '6fde47fc-c531-4d5e-a54a-025fcd2a4f9c', // X El Padel Lepe
  '4af50537-52b4-4f05-9770-585b4bdd337b', // Club Lora Pádel Indoor
  'b949ebbd-f65b-4e71-b793-e36fed53065e', // Soc Recreativa Huerta Jesús
  'e4ca00ff-63af-4d8c-a5bf-db67bc382c6a', // Sportres Padel Academy
  'bdc107d7-4cd8-4586-ab49-fa489ab27794', // Leyon NM pádel Academy
  '190cfb4c-d923-49d8-bb75-93bbda82f97d', // Matchpadel Academy Matchpadel
  'ec23d10f-0a14-4699-a50d-87c5e65d6417', // Matchpadel Academy Solopadel
  '3f71d96e-defe-4395-9f03-46dca0577f45', // Pádel Pibo
  '0fb97f06-0c84-4559-874c-4b63124f7e8f', // Iron X Deluxe
  'd2265a22-fc1e-4f63-bd90-a78e6475bce4', // R2 Pádel Itálica
  'b0fc8417-a9dc-4c7c-8a1a-0f6a7714588a', // Rico Pádel
  '6dbcc136-1fe3-4755-957a-6e9a35d29574', // IBL Padel Academy
  'c62db1b4-5c0f-4c1d-8d11-1905dd0512a8', // Escuela Soydepadel
];

// Club IDs excluded from ALL notifications (email + WhatsApp) - temporarily paused
const EXCLUDED_CLUBS: string[] = [
  '82608dac-fb10-422a-b158-9097d591fd57', // Finura Padel Academy - PAUSED
];

// Club IDs with WhatsApp reminders enabled via WHAPI (legacy system)
// PAUSED: All 24h reminders disabled temporarily (29 Dec 2025 - awaiting new eSIM setup)
const WHAPI_ENABLED_CLUBS: string[] = [
  // ALL CLUBS TEMPORARILY DISABLED - Will re-enable with new eSIM account
  // 'cc0a5265-99c5-4b99-a479-5334280d0c6d', // Gali - DISABLED
  // 'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport - DISABLED
  // 'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña - DISABLED
  // 'a994e74e-0a7f-4721-8c0f-e23100a01614', // Wild Padel Indoor - DISABLED
  // '7b6f49ae-d496-407b-bca1-f5f1e9370610', // Hespérides Padel - DISABLED
];

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Email translations by language (fallback to Spanish if not found)
const EMAIL_TRANSLATIONS: Record<string, {
  subject: string;
  title: string;
  greeting: string;
  intro: string;
  warningTitle: string;
  warningText: string;
  button: string;
  reminder: string;
  footer: string;
  dateLocale: string;
}> = {
  'es': {
    subject: '✅ Estás confirmado - {className}',
    title: '✅ Estás confirmado',
    greeting: 'Hola, <strong>{name}</strong> 👋',
    intro: 'Tu asistencia está confirmada automáticamente para tu próximo entrenamiento:',
    warningTitle: '⚠️ ¿No puedes asistir?',
    warningText: 'Marca tu ausencia en la web al menos 5 horas antes del entrenamiento para que otra persona pueda aprovechar tu plaza y tú recuperar la clase.',
    button: 'Gestionar mi asistencia',
    reminder: 'Recuerda: Tu plaza está reservada. Si no puedes venir, márcalo cuanto antes.',
    footer: 'Este es un email automático, por favor no respondas a este mensaje.',
    dateLocale: 'es-ES'
  },
  'en': {
    subject: '✅ You\'re confirmed - {className}',
    title: '✅ You\'re confirmed',
    greeting: 'Hello, <strong>{name}</strong> 👋',
    intro: 'Your attendance is automatically confirmed for your next training session:',
    warningTitle: '⚠️ Can\'t attend?',
    warningText: 'Mark your absence on the website at least 5 hours before training so someone else can take your spot and you can reschedule.',
    button: 'Manage my attendance',
    reminder: 'Remember: Your spot is reserved. If you can\'t come, let us know as soon as possible.',
    footer: 'This is an automated email, please do not reply to this message.',
    dateLocale: 'en-US'
  },
  'it': {
    subject: '✅ Sei confermato - {className}',
    title: '✅ Sei confermato',
    greeting: 'Ciao, <strong>{name}</strong> 👋',
    intro: 'La tua presenza è confermata automaticamente per il prossimo allenamento:',
    warningTitle: '⚠️ Non puoi partecipare?',
    warningText: 'Segnala la tua assenza sul sito almeno 5 ore prima dell\'allenamento per permettere a qualcun altro di prendere il tuo posto e riprogrammare la lezione.',
    button: 'Gestisci la mia presenza',
    reminder: 'Ricorda: Il tuo posto è riservato. Se non puoi venire, comunicacelo il prima possibile.',
    footer: 'Questa è un\'email automatica, per favore non rispondere a questo messaggio.',
    dateLocale: 'it-IT'
  }
};

interface ReminderEmailData {
  studentEmail: string;
  studentName: string;
  className: string;
  classDate: string;
  classTime: string;
  clubName: string;
  confirmationLink: string;
  language?: string; // Language code (es, en, it) - defaults to 'es'
}

interface WhatsAppReminderData {
  userEmail: string;
  participationId: string;
  className: string;
  startTime: string;
  durationMinutes: number;
  clubName: string;
  studentName: string;
  guardianPhone?: string; // Phone number of guardian (for temp email students)
  language?: string; // Language code for template selection (es, en, it) - defaults to 'es'
}

// Helper function to get guardian contact info for students with temp emails
async function getGuardianContactInfo(studentProfileId: string): Promise<{ email: string; phone: string | null } | null> {
  try {
    const { data: guardianData, error } = await supabase
      .from('account_dependents')
      .select(`
        guardian:profiles!account_dependents_guardian_profile_id_fkey (
          email,
          phone
        )
      `)
      .eq('dependent_profile_id', studentProfileId)
      .single();

    if (error || !guardianData?.guardian) {
      return null;
    }

    const guardian = guardianData.guardian as any;
    return {
      email: guardian.email,
      phone: guardian.phone
    };
  } catch (error) {
    console.error('Error fetching guardian info:', error);
    return null;
  }
}

async function sendWhatsAppReminder(data: WhatsAppReminderData, useKapso: boolean): Promise<boolean> {
  try {
    const reminderUrl = useKapso ? KAPSO_REMINDER_URL : WHAPI_REMINDER_URL;
    const system = useKapso ? 'Kapso' : 'Whapi';

    console.log(`📱 Sending WhatsApp reminder via ${system} to:`, data.userEmail);

    const response = await fetch(reminderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: data.userEmail,
        participationId: data.participationId,
        className: data.className,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        clubName: data.clubName,
        studentName: data.studentName,
        testSecret: TEST_SECRET,
        guardianPhone: data.guardianPhone, // Pass guardian phone for temp email students
        language: data.language || 'es' // Pass language for template selection
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ WhatsApp reminder sent successfully via ${system}`);
      return true;
    } else {
      console.error(`❌ WhatsApp reminder failed via ${system}:`, result.error);
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
    // Get translations for the language, fallback to Spanish
    const lang = data.language || 'es';
    const t = EMAIL_TRANSLATIONS[lang] || EMAIL_TRANSLATIONS['es'];

    console.log(`📧 Sending reminder email to: ${data.studentEmail} (language: ${lang})`);

    // Format date according to language
    const dateObj = new Date(data.classDate);
    const formattedDate = dateObj.toLocaleDateString(t.dateLocale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const subject = t.subject.replace('{className}', data.className);
    const greeting = t.greeting.replace('{name}', data.studentName);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${t.title}</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; color: #2d3748; margin-bottom: 10px;">
      ${greeting}
    </p>

    <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
      ${t.intro}
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
        ${t.warningTitle}
      </p>
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        ${t.warningText}
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.confirmationLink}" style="background-color: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
        ${t.button}
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
      ${t.reminder}
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>${t.footer}</p>
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
    // Note: Timeout extended to 150s in config.toml for Pro plan
    console.log('🔄 Starting attendance reminder job...');

    const now = new Date();
    console.log(`⏰ Current UTC time: ${now.toISOString()}`);

    // Helper function to get local time components in a specific timezone
    // Returns { year, month, day, hours, minutes, dayOfWeek } in that timezone
    const getLocalTimeComponents = (date: Date, timezone: string) => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          weekday: 'short'
        });

        const parts = formatter.formatToParts(date);
        const get = (type: string) => parts.find(p => p.type === type)?.value || '';

        return {
          year: parseInt(get('year')),
          month: parseInt(get('month')),
          day: parseInt(get('day')),
          hours: parseInt(get('hour')),
          minutes: parseInt(get('minute')),
          weekday: get('weekday') // 'Mon', 'Tue', etc.
        };
      } catch (e) {
        console.warn(`⚠️ Invalid timezone "${timezone}", falling back to Europe/Madrid`);
        return getLocalTimeComponents(date, 'Europe/Madrid');
      }
    };

    // Helper function to calculate 24h window for a specific timezone
    const get24hWindowForTimezone = (timezone: string) => {
      // Get current time in the club's timezone
      const localNow = getLocalTimeComponents(now, timezone);

      // Add 24 hours to the UTC time, then get the components in the target timezone
      const twentyFourHoursFromNowUTC = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyFourAndHalfHoursFromNowUTC = new Date(now.getTime() + (24 * 60 + 30) * 60 * 1000);

      const target24h = getLocalTimeComponents(twentyFourHoursFromNowUTC, timezone);
      const target24h30 = getLocalTimeComponents(twentyFourAndHalfHoursFromNowUTC, timezone);

      const targetDate = `${target24h.year}-${target24h.month.toString().padStart(2, '0')}-${target24h.day.toString().padStart(2, '0')}`;
      const windowStartTime = `${target24h.hours.toString().padStart(2, '0')}:${target24h.minutes.toString().padStart(2, '0')}`;
      const windowEndTime = `${target24h30.hours.toString().padStart(2, '0')}:${target24h30.minutes.toString().padStart(2, '0')}`;

      // Map weekday to Spanish day names
      const weekdayMap: { [key: string]: string[] } = {
        'Sun': ['domingo'],
        'Mon': ['lunes'],
        'Tue': ['martes'],
        'Wed': ['miercoles', 'miércoles'],
        'Thu': ['jueves'],
        'Fri': ['viernes'],
        'Sat': ['sabado', 'sábado']
      };
      const targetDayNames = weekdayMap[target24h.weekday] || [];

      return { targetDate, windowStartTime, windowEndTime, targetDayNames, localNowStr: `${localNow.hours}:${localNow.minutes.toString().padStart(2, '0')}` };
    };

    // Calculate target dates for all possible timezones (today+1 and today+2 to cover all cases)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterStr = dayAfter.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    console.log(`📅 Fetching classes with end_date >= ${todayStr} and start_date <= ${dayAfterStr}`);

    // 1. Get all active programmed classes with their club timezone
    // Filter by date range to reduce results (class must be valid for tomorrow or day after)
    const { data: classes, error: classesError} = await supabase
      .from('programmed_classes')
      .select(`
        id,
        name,
        start_time,
        duration_minutes,
        days_of_week,
        start_date,
        end_date,
        club_id,
        clubs:club_id (
          name,
          id,
          default_language,
          timezone
        )
      `)
      .eq('is_active', true)
      .gte('end_date', todayStr)
      .lte('start_date', dayAfterStr);

    if (classesError) {
      throw new Error(`Error fetching classes: ${classesError.message}`);
    }

    console.log(`📚 Found ${classes?.length || 0} active classes total`);

    if (!classes || classes.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No active classes found',
        remindersSent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Filter classes based on their club's timezone
    // Each class is evaluated against its own club's local time
    const targetClasses: Array<{ cls: typeof classes[0]; targetDate: string }> = [];

    // Only log timezone once per unique timezone to reduce spam
    const loggedTimezones = new Set<string>();

    for (const cls of classes) {
      const clubTimezone = (cls.clubs as any)?.timezone || 'Europe/Madrid';
      const { targetDate, windowStartTime, windowEndTime, targetDayNames, localNowStr } = get24hWindowForTimezone(clubTimezone);

      // Only log each timezone once
      if (!loggedTimezones.has(clubTimezone)) {
        loggedTimezones.add(clubTimezone);
        console.log(`🌍 Timezone ${clubTimezone}: now=${localNowStr}, target=${targetDate} [${windowStartTime}-${windowEndTime}]`);
      }

      // Check if class is within its date range
      if (cls.start_date > targetDate || cls.end_date < targetDate) {
        continue;
      }

      const daysOfWeek = cls.days_of_week || [];

      // Check if class is scheduled for target day (in club's timezone)
      const matchesDay = targetDayNames.some((dayName: string) => daysOfWeek.includes(dayName));

      if (!matchesDay) {
        // Debug: log classes that pass date filter but fail day filter
        if (cls.name.toLowerCase().includes('test') || cls.name.toLowerCase().includes('prueba')) {
          console.log(`🔍 DEBUG ${cls.name}: date OK, but day mismatch. Class days: [${daysOfWeek.join(', ')}], target days: [${targetDayNames.join(', ')}]`);
        }
        continue;
      }

      // Check if class time falls within the 30-minute window
      const classTime = cls.start_time.substring(0, 5); // HH:MM format
      const isInTimeWindow = classTime >= windowStartTime && classTime < windowEndTime;

      if (!isInTimeWindow) {
        // Debug: log classes that pass day filter but fail time filter
        if (cls.name.toLowerCase().includes('test') || cls.name.toLowerCase().includes('prueba')) {
          console.log(`🔍 DEBUG ${cls.name}: day OK, but time mismatch. Class time: ${classTime}, window: [${windowStartTime}-${windowEndTime}]`);
        }
        continue;
      }

      console.log(`✅ Including ${cls.name} at ${classTime} (${clubTimezone}) - within 24h window [${windowStartTime}-${windowEndTime}]`);
      targetClasses.push({ cls, targetDate });
    }

    console.log(`🎯 Found ${targetClasses.length} classes starting in ~24 hours (across all timezones)`);

    // Filter out cancelled classes
    const classIds = targetClasses.map(c => c.cls.id);
    const allTargetDates = [...new Set(targetClasses.map(c => c.targetDate))];

    const { data: cancelledData } = await supabase
      .from('cancelled_classes')
      .select('class_id, cancelled_date')
      .in('class_id', classIds)
      .in('cancelled_date', allTargetDates);

    // Create a set of cancelled class+date combinations
    const cancelledSet = new Set(
      cancelledData?.map(c => `${c.class_id}_${c.cancelled_date}`) || []
    );

    const activeTargetClasses = targetClasses.filter(({ cls, targetDate }) => {
      const key = `${cls.id}_${targetDate}`;
      if (cancelledSet.has(key)) {
        console.log(`⏭️ Skipping cancelled class: ${cls.name} at ${cls.start_time} on ${targetDate}`);
        return false;
      }
      return true;
    });

    console.log(`📋 Processing ${activeTargetClasses.length} active classes (${cancelledSet.size} cancelled)`);

    let totalRemindersSent = 0;
    let totalWhatsAppSent = 0;

    // 2. For each target class, send reminders to all active participants
    for (const { cls: classInfo, targetDate } of activeTargetClasses) {
      // Skip clubs excluded from all notifications
      if (EXCLUDED_CLUBS.includes(classInfo.club_id)) {
        console.log(`⏭️ Skipping excluded club: ${(classInfo.clubs as any)?.name} (${classInfo.name})`);
        continue;
      }

      const clubTimezone = (classInfo.clubs as any)?.timezone || 'Europe/Madrid';
      console.log(`\n📋 Processing class: ${classInfo.name} at ${classInfo.start_time} (${clubTimezone}) for ${targetDate}`);

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
            email,
            student_profile_id,
            is_ghost
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

        // Skip ghost enrollments - they don't have a real account to receive notifications
        if (enrollment.is_ghost) {
          console.log(`👻 Skipping ghost enrollment: ${enrollment.full_name} (${participant.id})`);
          continue;
        }

        // Determine recipient: check if this is a temp email (guardian's child or guardian-as-student)
        // If so, redirect notifications to the guardian instead
        let recipientEmail = enrollment.email;
        let guardianPhone: string | null = null;
        const studentName = enrollment.full_name; // Always use the student/child name

        if (enrollment.email.includes('@temp.padelock.com') && enrollment.student_profile_id) {
          // This is a temp email - look up the guardian
          const guardianInfo = await getGuardianContactInfo(enrollment.student_profile_id);

          if (guardianInfo?.email) {
            recipientEmail = guardianInfo.email;
            guardianPhone = guardianInfo.phone;
            console.log(`👨‍👩‍👧 Redirecting notification for "${studentName}" to guardian: ${recipientEmail}`);
          } else {
            // No guardian found for temp email - skip this participant
            console.warn(`⚠️ Skipping temp email student without guardian: ${enrollment.email} (${studentName})`);
            continue;
          }
        }

        const confirmationLink = 'https://www.padelock.com/dashboard';
        const clubLanguage = (classInfo.clubs as any)?.default_language || 'es';

        const emailSent = await sendReminderEmail({
          studentEmail: recipientEmail,
          studentName: studentName,
          className: classInfo.name,
          classDate: targetDate,
          classTime: classInfo.start_time,
          clubName: (classInfo.clubs as any)?.name || '',
          confirmationLink,
          language: clubLanguage
        });

        if (emailSent) {
          totalRemindersSent++;
        }

        // Send WhatsApp reminder for clubs with WhatsApp enabled (Kapso or Whapi)
        const useKapso = KAPSO_ENABLED_CLUBS.includes(classInfo.club_id);
        const useWhapi = WHAPI_ENABLED_CLUBS.includes(classInfo.club_id);

        if (useKapso || useWhapi) {
          const system = useKapso ? 'Kapso' : 'Whapi';
          const clubLanguage = (classInfo.clubs as any)?.default_language || 'es';
          console.log(`📱 Sending WhatsApp via ${system} for student "${studentName}" to: ${recipientEmail} (club: ${(classInfo.clubs as any)?.name}, language: ${clubLanguage})`);
          const whatsappSent = await sendWhatsAppReminder({
            userEmail: recipientEmail,
            participationId: participant.id,
            className: classInfo.name,
            startTime: classInfo.start_time,
            durationMinutes: classInfo.duration_minutes || 60,
            clubName: (classInfo.clubs as any)?.name || '',
            studentName: studentName,
            guardianPhone: guardianPhone || undefined,
            language: clubLanguage
          }, useKapso);
          if (whatsappSent) {
            totalWhatsAppSent++;
          }
          // Delay for WhatsApp rate limiting (500ms - Meta API supports ~80 templates/min)
          // This also covers the email rate limit (2/s = 500ms), so skip the email delay below
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // Delay to respect Resend rate limit (2 emails/second = 500ms between emails)
          // Only when no WhatsApp delay was applied above
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    console.log(`\n✅ Job completed. Sent ${totalRemindersSent} reminder emails and ${totalWhatsAppSent} WhatsApp messages`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${totalRemindersSent} attendance reminder emails and ${totalWhatsAppSent} WhatsApp messages`,
      remindersSent: totalRemindersSent,
      whatsappSent: totalWhatsAppSent,
      classesProcessed: activeTargetClasses.length,
      cancelledClassesSkipped: cancelledSet.size
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
