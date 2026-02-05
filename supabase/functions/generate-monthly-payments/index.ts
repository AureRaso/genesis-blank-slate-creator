import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface GenerationResult {
  success: boolean;
  log_id: string;
  billing_day: number;
  target_period: string;
  total_processed: number;
  generated: number;
  skipped: number;
  errors: number;
  execution_time_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional parameters
    let billingDay: number | null = null;
    let targetMonth: number | null = null;
    let targetYear: number | null = null;
    let triggeredBy: string = 'cron';

    try {
      const body = await req.json();
      billingDay = body.billingDay ?? null;
      targetMonth = body.targetMonth ?? null;
      targetYear = body.targetYear ?? null;
      triggeredBy = body.triggeredBy ?? 'cron';
    } catch {
      // No body or invalid JSON - use defaults (current day for cron execution)
    }

    // If no billing day specified, use current day of month
    if (billingDay === null) {
      const now = new Date();
      billingDay = now.getUTCDate();

      // Skip if current day is > 28 (not a valid billing day)
      if (billingDay > 28) {
        console.log(`Day ${billingDay} is not a valid billing day (1-28), skipping`);
        return new Response(JSON.stringify({
          success: true,
          message: `Day ${billingDay} is not a valid billing day (1-28), no payments generated`,
          generated: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    console.log(`Generating payments for billing_day=${billingDay}, month=${targetMonth ?? 'current'}, year=${targetYear ?? 'current'}, triggered_by=${triggeredBy}`);

    // Call the RPC function to generate payments
    const { data, error } = await supabaseClient.rpc('auto_generate_monthly_payments', {
      p_billing_day: billingDay,
      p_target_month: targetMonth,
      p_target_year: targetYear,
      p_triggered_by: triggeredBy
    });

    if (error) {
      throw new Error(`Error calling auto_generate_monthly_payments: ${error.message}`);
    }

    const result = data as GenerationResult;

    console.log(`Payment generation completed:`, result);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: `Generated ${result.generated} payments for billing day ${billingDay}`,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-monthly-payments function:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
