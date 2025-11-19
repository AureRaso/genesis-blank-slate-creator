-- =====================================================
-- Create Cron Job for Attendance Reminders
-- Runs every hour to send 24-hour advance reminders
-- =====================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to trigger the attendance reminders Edge Function
CREATE OR REPLACE FUNCTION trigger_attendance_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INTEGER;
BEGIN
  -- Call the Edge Function using pg_net
  -- The function handles finding all classes that need reminders (24 hours before)
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-attendance-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );

  -- Log the trigger
  RAISE NOTICE 'Triggered attendance reminders check at %', NOW();
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the cron job
    RAISE WARNING 'Error triggering attendance reminders: %', SQLERRM;
END;
$$;

-- Schedule attendance reminders every hour
-- Cron format: minute hour day month weekday
-- Runs at the top of every hour
SELECT cron.schedule(
  'attendance-reminders-hourly',
  '0 * * * *',  -- Every hour at :00 minutes
  $$SELECT trigger_attendance_reminders()$$
);

-- Add helpful comment
COMMENT ON FUNCTION trigger_attendance_reminders IS 'Triggers attendance reminder emails for classes starting in 24 hours. Runs every hour.';

-- Query to check scheduled cron jobs:
-- SELECT * FROM cron.job WHERE jobname = 'attendance-reminders-hourly';

-- To manually trigger (for testing):
-- SELECT trigger_attendance_reminders();

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('attendance-reminders-hourly');
