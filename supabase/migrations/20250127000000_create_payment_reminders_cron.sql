-- =====================================================
-- Create Cron Job for Payment Reminders
-- Runs daily at 9:00 AM to send 7-day advance reminders
-- =====================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to trigger the payment reminders Edge Function
CREATE OR REPLACE FUNCTION trigger_payment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Edge Function using pg_net
  -- The function handles finding all pending payments due in 7 days
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-payment-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );

  -- Log the trigger
  RAISE NOTICE 'Triggered payment reminders check at %', NOW();
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the cron job
    RAISE WARNING 'Error triggering payment reminders: %', SQLERRM;
END;
$$;

-- Schedule payment reminders daily at 9:00 AM (Spain time, UTC+1/+2)
-- Using 8:00 AM UTC to be 9:00 AM in Spain (winter) or 10:00 AM (summer)
-- Cron format: minute hour day month weekday
SELECT cron.schedule(
  'payment-reminders-daily',
  '0 8 * * *',  -- Daily at 8:00 UTC (9:00 AM Spain)
  $$SELECT trigger_payment_reminders()$$
);

-- Add helpful comment
COMMENT ON FUNCTION trigger_payment_reminders IS 'Triggers payment reminder emails for payments due in 7 days. Runs daily at 9:00 AM Spain time.';

-- Query to check scheduled cron jobs:
-- SELECT * FROM cron.job WHERE jobname = 'payment-reminders-daily';

-- To manually trigger (for testing):
-- SELECT trigger_payment_reminders();

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('payment-reminders-daily');
