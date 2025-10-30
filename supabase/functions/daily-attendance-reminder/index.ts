import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Daily Attendance Reminder - Starting ===');
    console.log('Timestamp:', new Date().toISOString());

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✓ Supabase client created');

    // Log to database for debugging
    await supabaseClient.from('cron_debug_logs').insert({
      function_name: 'daily-attendance-reminder',
      log_level: 'info',
      message: 'Function started',
      details: {
        timestamp: new Date().toISOString(),
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }
    });

    // Get Whapi credentials from environment
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const whapiEndpoint = Deno.env.get('WHAPI_ENDPOINT') || 'https://gate.whapi.cloud';

    if (!whapiToken) {
      await supabaseClient.from('cron_debug_logs').insert({
        function_name: 'daily-attendance-reminder',
        log_level: 'error',
        message: 'WHAPI_TOKEN not configured'
      });
      throw new Error('WHAPI_TOKEN not configured');
    }
    console.log('✓ WHAPI credentials present');

    // Get the base URL for the app
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://genesis-blank-slate-creator.lovable.app';

    // Fetch all active WhatsApp groups
    const { data: whatsappGroups, error: groupsError} = await supabaseClient
      .from('whatsapp_groups')
      .select(`
        id,
        group_chat_id,
        group_name,
        club_id,
        is_active,
        clubs:club_id (
          name
        )
      `)
      .eq('is_active', true);

    // Log groups fetched
    await supabaseClient.from('cron_debug_logs').insert({
      function_name: 'daily-attendance-reminder',
      log_level: 'info',
      message: 'WhatsApp groups fetched',
      details: {
        groupsCount: whatsappGroups?.length || 0,
        hasError: !!groupsError,
        error: groupsError
      }
    });

    if (groupsError) {
      console.error('Error fetching WhatsApp groups:', groupsError);
      throw groupsError;
    }

    if (!whatsappGroups || whatsappGroups.length === 0) {
      console.log('No active WhatsApp groups found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active WhatsApp groups to notify',
          sentCount: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${whatsappGroups.length} active WhatsApp groups`);

    // Generate the reminder message
    const today = new Date();
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = dayNames[today.getDay()];
    const formattedDate = today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `🎾 ¡Buenos días!

📅 Hoy es *${formattedDate}*

⏰ *Recordatorio de asistencia*

Por favor, confirma tu asistencia a las clases de hoy entrando en la aplicación:
👉 ${appBaseUrl}

✅ Confirmar asistencia
❌ Notificar ausencia

Es importante que confirmes lo antes posible para que podamos organizar mejor las clases.

¡Nos vemos en la pista! 🎾`;

    // Send message to each group
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const group of whatsappGroups) {
      console.log(`Sending reminder to group: ${group.group_name} (${group.group_chat_id})`);

      try {
        const response = await fetch(`${whapiEndpoint}/messages/text`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whapiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: group.group_chat_id,
            body: message,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send to ${group.group_name}:`, errorText);
          failureCount++;
          results.push({
            groupId: group.id,
            groupName: group.group_name,
            success: false,
            error: errorText
          });
        } else {
          const result = await response.json();
          console.log(`✓ Message sent to ${group.group_name}:`, result);
          successCount++;
          results.push({
            groupId: group.id,
            groupName: group.group_name,
            success: true,
            messageId: result.id || result.message_id
          });
        }

        // Add a small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error sending to ${group.group_name}:`, error);
        failureCount++;
        results.push({
          groupId: group.id,
          groupName: group.group_name,
          success: false,
          error: error.message
        });
      }
    }

    console.log('=== Summary ===');
    console.log(`Total groups: ${whatsappGroups.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failures: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily attendance reminders sent',
        totalGroups: whatsappGroups.length,
        successCount,
        failureCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in daily-attendance-reminder:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
