import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { collectReportData } from './data-collector.ts';
import { generateDailyReportMessage, generateSuggestedActions } from './report-generator.ts';
import { sendGroupMessage, validateWhapiConfig, WhapiConfig } from './whapi-client.ts';

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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const whapiUrl = Deno.env.get('WHAPI_URL') || 'https://gate.whapi.cloud';
    const whapiToken = Deno.env.get('WHAPI_TOKEN')!;

    // Validate Whapi config
    const whapiConfig: WhapiConfig = {
      apiUrl: whapiUrl,
      token: whapiToken
    };

    if (!validateWhapiConfig(whapiConfig)) {
      throw new Error('Invalid Whapi configuration. Check WHAPI_URL and WHAPI_TOKEN environment variables.');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { clubId, reportType, manual } = await req.json();

    if (!clubId) {
      return new Response(
        JSON.stringify({ error: 'clubId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const type = reportType || 'morning';

    console.log(`Generating ${type} report for club ${clubId}`);

    // Get WhatsApp groups configured for this club
    const { data: groups, error: groupsError } = await supabase
      .from('whatsapp_report_groups')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_active', true);

    if (groupsError) {
      throw new Error(`Error fetching WhatsApp groups: ${groupsError.message}`);
    }

    if (!groups || groups.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No active WhatsApp groups configured for this club'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Generate and send report for each group (simplified - one group per club)
    for (const group of groups) {
      try {
        // Check if report should be sent based on time
        const shouldSendMorning = type === 'morning' && group.send_morning_report;
        const shouldSendAfternoon = type === 'afternoon' && group.send_afternoon_report;

        if (!shouldSendMorning && !shouldSendAfternoon && !manual) {
          console.log(`Skipping group ${group.group_name} - report type not enabled`);
          continue;
        }

        // Collect data for report (simplified - no trainer filtering)
        const reportData = await collectReportData(
          supabase,
          clubId,
          type
        );

        // Generate suggested actions
        reportData.urgent_actions = generateSuggestedActions(reportData);

        // Generate formatted message
        const message = generateDailyReportMessage(reportData);

        // Send message via Whapi
        console.log(`Sending report to group: ${group.group_name} (${group.whatsapp_group_id})`);
        const sendResult = await sendGroupMessage(
          whapiConfig,
          group.whatsapp_group_id,
          message
        );

        results.push({
          group: group.group_name,
          success: sendResult.success,
          message: sendResult.message,
          error: sendResult.error
        });

      } catch (error) {
        console.error(`Error processing group ${group.group_name}:`, error);
        results.push({
          group: group.group_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        clubId,
        reportType: type,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-daily-report function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
