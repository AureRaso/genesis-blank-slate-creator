-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to trigger the Edge Function for all active clubs
CREATE OR REPLACE FUNCTION trigger_daily_reports(report_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  club_record RECORD;
  request_body JSONB;
  response_status INTEGER;
BEGIN
  -- Get all clubs with active WhatsApp report configurations
  FOR club_record IN
    SELECT DISTINCT club_id
    FROM whatsapp_report_groups
    WHERE is_active = true
    AND (
      (report_type = 'morning' AND send_morning_report = true)
      OR
      (report_type = 'afternoon' AND send_afternoon_report = true)
    )
  LOOP
    -- Prepare request body
    request_body := jsonb_build_object(
      'clubId', club_record.club_id,
      'reportType', report_type,
      'manual', false
    );

    -- Call the Edge Function using pg_net
    -- Note: You need to replace YOUR_FUNCTION_URL with your actual Edge Function URL
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-daily-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := request_body
      );

    -- Log the trigger
    RAISE NOTICE 'Triggered % report for club %', report_type, club_record.club_id;
  END LOOP;
END;
$$;

-- Schedule morning reports at 10:00 AM (Europe/Madrid time)
-- Cron format: minute hour day month weekday
SELECT cron.schedule(
  'whatsapp-morning-reports',
  '0 10 * * *',  -- Every day at 10:00 AM
  $$SELECT trigger_daily_reports('morning')$$
);

-- Schedule afternoon reports at 13:00 (1:00 PM) (Europe/Madrid time)
SELECT cron.schedule(
  'whatsapp-afternoon-reports',
  '0 13 * * *',  -- Every day at 1:00 PM
  $$SELECT trigger_daily_reports('afternoon')$$
);

-- View scheduled jobs
COMMENT ON FUNCTION trigger_daily_reports IS 'Triggers daily WhatsApp reports for all active clubs at scheduled times';

-- Query to check scheduled cron jobs:
-- SELECT * FROM cron.job;

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('whatsapp-morning-reports');
-- SELECT cron.unschedule('whatsapp-afternoon-reports');
