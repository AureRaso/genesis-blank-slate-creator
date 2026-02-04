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

// Kapso API configuration
const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY') ?? '';
const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID') ?? '';
const KAPSO_BASE_URL = Deno.env.get('KAPSO_BASE_URL') || 'https://api.kapso.ai/meta/whatsapp/v24.0';

// Template configuration per language
// All templates use the same parameters: nombre_jugador, club, fecha_clase, hora_clase
const TEMPLATE_CONFIG: Record<string, { name: string; languageCode: string }> = {
  'es': { name: 'class_cancellation', languageCode: 'es' },
  'en': { name: 'class_cancelation_en', languageCode: 'en' },
  'it': { name: 'class_cancelation_it', languageCode: 'it' }
};

// Clubs excluded from all notifications
const EXCLUDED_CLUBS: string[] = [
  '82608dac-fb10-422a-b158-9097d591fd57', // Finura Padel Academy - PAUSED
];

// Locale map for date formatting
const LOCALE_MAP: Record<string, string> = {
  'es': 'es-ES',
  'en': 'en-US',
  'it': 'it-IT'
};

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
 * Format date in the specified language
 */
function formatDateLocalized(dateStr: string, language: string = 'es'): string {
  const date = new Date(dateStr + 'T00:00:00');
  const locale = LOCALE_MAP[language] || 'es-ES';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Check if email is a temporary/dependent email
 */
function isTempEmail(email: string): boolean {
  return email?.includes('@temp.padelock.com') || email?.startsWith('temp_');
}

/**
 * Get guardian phone for a dependent student (by their temp email)
 * This looks up the guardian through account_dependents table
 */
async function getGuardianPhone(
  supabaseClient: any,
  tempEmail: string
): Promise<string | null> {
  try {
    // First, find the profile with this temp email
    const { data: childProfile, error: childError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', tempEmail)
      .single();

    if (childError || !childProfile) {
      console.log(`   No profile found for temp email: ${tempEmail}`);
      return null;
    }

    // Then find the guardian through account_dependents
    const { data: guardianData, error: guardianError } = await supabaseClient
      .from('account_dependents')
      .select(`
        guardian:guardian_profile_id (
          phone,
          email
        )
      `)
      .eq('dependent_profile_id', childProfile.id)
      .single();

    if (guardianError || !guardianData?.guardian) {
      console.log(`   No guardian found for dependent: ${tempEmail}`);
      return null;
    }

    const guardianPhone = (guardianData.guardian as any)?.phone;
    if (guardianPhone) {
      console.log(`   ✓ Found guardian phone for ${tempEmail}: ${guardianPhone}`);
    }
    return guardianPhone || null;

  } catch (error) {
    console.error(`   Error looking up guardian for ${tempEmail}:`, error);
    return null;
  }
}

/**
 * Send WhatsApp template message via Kapso API for class cancellation
 * Templates per language:
 *   - ES: class_cancellation
 *   - EN: class_cancelation_en
 *   - IT: class_cancelation_it
 * Parameters: nombre_jugador, club, fecha_clase, hora_clase
 */
async function sendKapsoCancellationTemplate(
  phone: string,
  studentName: string,
  clubName: string,
  classDate: string,
  classTime: string,
  language: string = 'es'
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
    return { success: false, error: 'Kapso API not configured' };
  }

  const formattedPhone = formatPhoneNumber(phone);
  const url = `${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`;

  // Get template config for the language (fallback to Spanish)
  const templateConfig = TEMPLATE_CONFIG[language] || TEMPLATE_CONFIG['es'];

  // Format date and time for the template
  const formattedDate = formatDateLocalized(classDate, language);
  const formattedTime = classTime.substring(0, 5); // HH:MM

  console.log(`📱 Sending Kapso cancellation template to: ${formattedPhone}`);
  console.log(`   Template: ${templateConfig.name} (language: ${templateConfig.languageCode})`);
  console.log(`   Params: ${studentName}, ${clubName}, ${formattedDate}, ${formattedTime}`);

  // All templates have the same named parameters:
  // {{nombre_jugador}}, {{club}}, {{fecha_clase}}, {{hora_clase}}
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateConfig.name,
      language: { code: templateConfig.languageCode },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "nombre_jugador", text: studentName },
            { type: "text", parameter_name: "club", text: clubName },
            { type: "text", parameter_name: "fecha_clase", text: formattedDate },
            { type: "text", parameter_name: "hora_clase", text: formattedTime }
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

    console.log('✅ Kapso cancellation template sent successfully:', result);
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
    console.log('=== Class Cancellation Kapso Notification ===');

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

    // Get club info for this class (including language for i18n)
    const { data: classData, error: classError } = await supabaseClient
      .from('programmed_classes')
      .select(`
        id,
        club_id,
        clubs:club_id (
          name,
          default_language
        )
      `)
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('Error fetching class info:', classError);
      throw new Error('Failed to fetch class info');
    }

    const clubName = (classData?.clubs as any)?.name || 'Tu club';
    const clubLanguage = (classData?.clubs as any)?.default_language || 'es';
    console.log(`✓ Club: ${clubName} (language: ${clubLanguage})`);

    // Skip clubs excluded from all notifications
    if (EXCLUDED_CLUBS.includes(classData.club_id)) {
      console.log(`⏭️ Skipping excluded club: ${clubName}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Club ${clubName} is excluded from notifications`,
          notificationsSent: 0,
          notificationsFailed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
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

    // Get phone numbers from profiles table as fallback for participants without phone in student_enrollments
    const participantsWithoutPhone = participants.filter((p: any) => !p.student_enrollments?.phone);
    const emailsWithoutPhone = participantsWithoutPhone
      .map((p: any) => p.student_enrollments?.email)
      .filter(Boolean);

    let profilePhones: Record<string, string> = {};

    if (emailsWithoutPhone.length > 0) {
      console.log(`📱 Looking up phones in profiles table for ${emailsWithoutPhone.length} participants...`);

      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('email, phone')
        .in('email', emailsWithoutPhone);

      if (profiles) {
        profilePhones = profiles.reduce((acc: Record<string, string>, p: any) => {
          if (p.email && p.phone) {
            acc[p.email] = p.phone;
          }
          return acc;
        }, {});
        console.log(`✓ Found ${Object.keys(profilePhones).length} phone numbers in profiles table`);
      }
    }

    // Send notifications to each participant
    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const participant of participants) {
      const student = (participant as any).student_enrollments;

      // Use phone from student_enrollments, fallback to profiles table
      let studentPhone = student?.phone || profilePhones[student?.email];

      // If no phone found and it's a temp email (dependent), try to get guardian's phone
      if (!studentPhone && student?.email && isTempEmail(student.email)) {
        console.log(`📱 Temp email detected for ${student.email}, looking up guardian phone...`);
        const guardianPhone = await getGuardianPhone(supabaseClient, student.email);
        if (guardianPhone) {
          studentPhone = guardianPhone;
          console.log(`   ✓ Will use guardian phone: ${guardianPhone}`);
        }
      }

      if (!studentPhone) {
        console.log(`⚠ Skipping ${student?.email || 'unknown'}: no phone number in student_enrollments, profiles, or guardian`);
        results.push({
          email: student?.email,
          success: false,
          reason: 'No phone number'
        });
        failureCount++;
        continue;
      }

      // Log if we used fallback
      if (!student?.phone && profilePhones[student?.email]) {
        console.log(`📱 Using phone from profiles table for ${student.email}`);
      }

      try {
        console.log(`📤 Sending cancellation to ${student.email} (${studentPhone})...`);

        const result = await sendKapsoCancellationTemplate(
          studentPhone,
          student.full_name,
          clubName,
          cancelledDate,
          classTime,
          clubLanguage
        );

        if (result.success) {
          console.log(`✓ Notification sent to ${student.email}`);
          results.push({
            email: student.email,
            success: true,
            messageId: result.messageId
          });
          successCount++;
        } else {
          console.error(`✗ Kapso error for ${student.email}:`, result.error);
          results.push({
            email: student.email,
            success: false,
            reason: result.error
          });
          failureCount++;
        }

        // Small delay between messages (500ms - Meta API oficial soporta ráfagas)
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
        message: 'Cancellation notifications sent via Kapso',
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
