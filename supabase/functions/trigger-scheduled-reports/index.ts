import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Webhook endpoint to trigger all scheduled reports
 * This should be called by an external cron service (e.g., cron-job.org, GitHub Actions)
 *
 * Usage:
 * POST /trigger-scheduled-reports
 * Body: { "reportType": "morning" | "afternoon", "cronSecret": "your-secret-key" }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET') || 'change-me-in-production';

    const { reportType, cronSecret: providedSecret } = await req.json();

    // Validate cron secret
    if (providedSecret !== cronSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid cron secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reportType || !['morning', 'afternoon'].includes(reportType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reportType. Must be "morning" or "afternoon"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active clubs with WhatsApp report configurations
    const { data: configs, error } = await supabase
      .from('whatsapp_report_groups')
      .select('club_id')
      .eq('is_active', true)
      .eq(reportType === 'morning' ? 'send_morning_report' : 'send_afternoon_report', true);

    if (error) {
      throw error;
    }

    console.log(`Found ${configs?.length || 0} clubs to send ${reportType} reports`);

    const results = [];

    // Trigger report for each club
    for (const config of configs || []) {
      try {
        // Call the generate-daily-report Edge Function
        const { data, error } = await supabase.functions.invoke('generate-daily-report', {
          body: {
            clubId: config.club_id,
            reportType,
            manual: false,
          },
        });

        if (error) {
          console.error(`Error triggering report for club ${config.club_id}:`, error);
          results.push({
            club_id: config.club_id,
            success: false,
            error: error.message,
          });
        } else {
          console.log(`Successfully triggered report for club ${config.club_id}`);
          results.push({
            club_id: config.club_id,
            success: true,
            data,
          });
        }
      } catch (error) {
        console.error(`Exception triggering report for club ${config.club_id}:`, error);
        results.push({
          club_id: config.club_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportType,
        totalClubs: configs?.length || 0,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trigger-scheduled-reports:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
