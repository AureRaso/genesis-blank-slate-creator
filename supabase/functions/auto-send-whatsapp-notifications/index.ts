import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PendingNotification {
  id: string;
  class_participant_id: string;
  class_id: string;
  student_profile_id: string;
  student_level: number;
  target_whatsapp_group_id: string;
  scheduled_for: string;
  created_at: string;
  status: string;
  class_data: {
    class_id: string;
    class_name: string;
    start_time: string;
    duration_minutes: number;
    class_date: string;
    student_name: string;
    student_email: string;
    student_level: number;
    target_group_name: string;
  };
  whatsapp_groups?: {
    group_chat_id: string;
    group_name: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Auto-send WhatsApp notifications function started');
    console.log('⚠️ AUTOMATIC NOTIFICATIONS DISABLED - Notifications are only sent manually');

    // Return immediately without processing any notifications
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automatic notifications are disabled. Notifications are only sent manually.',
        processed: 0,
        disabled: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Fatal error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
