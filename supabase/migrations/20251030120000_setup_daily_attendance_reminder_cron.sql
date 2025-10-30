-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Grant necessary permissions to postgres user for cron
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Create a function to invoke the Edge Function
create or replace function invoke_daily_attendance_reminder()
returns void
language plpgsql
security definer
as $$
declare
  service_role_key text;
  function_url text;
  response text;
begin
  -- Get the service role key from vault or use environment variable
  -- Note: In production, this should be stored securely
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Construct the function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/daily-attendance-reminder';

  -- Call the Edge Function using pg_net
  perform
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := '{}'::jsonb
    );

  raise notice 'Daily attendance reminder triggered at %', now();
exception
  when others then
    raise warning 'Error triggering daily attendance reminder: %', sqlerrm;
end;
$$;

-- Schedule the cron job to run every day at 9:00 AM (Madrid time - UTC+1/UTC+2)
-- We use 8:00 UTC to match 9:00 AM in Madrid during winter (UTC+1)
-- Note: During summer time (UTC+2), this will be 10:00 AM. Adjust if needed.
select cron.schedule(
  'daily-attendance-reminder',  -- job name
  '0 8 * * *',                  -- cron expression: every day at 8:00 AM UTC (9:00 AM Madrid winter time)
  $$select invoke_daily_attendance_reminder();$$
);

-- To adjust for summer time (UTC+2), use:
-- select cron.schedule(
--   'daily-attendance-reminder',
--   '0 7 * * *',  -- 7:00 AM UTC = 9:00 AM Madrid summer time
--   $$select invoke_daily_attendance_reminder();$$
-- );

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('daily-attendance-reminder');
