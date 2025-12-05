-- =====================================================
-- SETUP SCRIPT: Attendance Reminders Cron Job
-- =====================================================
-- This script sets up the hourly cron job for sending
-- attendance reminders 24 hours before classes.
--
-- IMPORTANT: Before running this script, you need to:
-- 1. Set the database configuration parameters (see step 1 below)
-- 2. Ensure pg_cron and pg_net extensions are enabled
-- =====================================================

-- Step 1: Configure database settings (RUN THESE FIRST - MANUALLY)
-- Replace YOUR_PROJECT_ID and YOUR_SERVICE_ROLE_KEY with actual values
-- You can find these in your Supabase project settings

-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_ID.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- To verify the settings are configured:
-- SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings%';

-- =====================================================
-- Step 2: Enable required extensions
-- =====================================================

-- Enable pg_cron extension (for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================
-- Step 3: Create the trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_attendance_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_record RECORD;
BEGIN
  -- Call the Edge Function using pg_net
  -- The function handles finding all classes that need reminders (24 hours before)
  SELECT INTO response_record
    *
  FROM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-attendance-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );

  -- Log the response
  RAISE NOTICE 'Attendance reminders triggered at %. Status: %', NOW(), response_record.status;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the cron job
    RAISE WARNING 'Error triggering attendance reminders: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION trigger_attendance_reminders IS 'Triggers attendance reminder emails for classes starting in 24 hours. Runs every hour.';

-- =====================================================
-- Step 4: Schedule the cron job
-- =====================================================

-- First, unschedule if it already exists (to avoid duplicates)
SELECT cron.unschedule('attendance-reminders-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'attendance-reminders-hourly'
);

-- Schedule attendance reminders every hour at :00 minutes
SELECT cron.schedule(
  'attendance-reminders-hourly',
  '0 * * * *',  -- Every hour at :00 minutes (e.g., 10:00, 11:00, 12:00, etc.)
  $$SELECT trigger_attendance_reminders()$$
);

-- =====================================================
-- Step 5: Verify the setup
-- =====================================================

-- Check if the cron job is scheduled
SELECT
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'attendance-reminders-hourly';

-- =====================================================
-- TESTING & TROUBLESHOOTING
-- =====================================================

-- To manually trigger the function (for testing):
-- SELECT trigger_attendance_reminders();

-- To check cron job execution history:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'attendance-reminders-hourly')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('attendance-reminders-hourly');

-- To check database settings:
-- SHOW app.settings.supabase_url;
-- SHOW app.settings.service_role_key;
