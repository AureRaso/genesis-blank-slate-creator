-- =====================================================
-- Cron Job: Auto-cancel expired private lesson bookings
-- Runs every 15 minutes to cancel pending bookings
-- where auto_cancel_at has passed (2h without trainer response)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Function to trigger the Edge Function
CREATE OR REPLACE FUNCTION trigger_private_lesson_timeout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/process-private-lesson-timeout',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );

  RAISE NOTICE 'Triggered private lesson timeout check at %', NOW();
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error triggering private lesson timeout: %', SQLERRM;
END;
$$;

-- Schedule every 15 minutes
SELECT cron.schedule(
  'private-lesson-timeout-check',
  '*/15 * * * *',
  $$SELECT trigger_private_lesson_timeout()$$
);

COMMENT ON FUNCTION trigger_private_lesson_timeout IS
  'Triggers auto-cancellation of private lesson bookings pending > 2 hours. Runs every 15 minutes.';

-- Check: SELECT * FROM cron.job WHERE jobname = 'private-lesson-timeout-check';
-- Manual: SELECT trigger_private_lesson_timeout();
-- Remove: SELECT cron.unschedule('private-lesson-timeout-check');
