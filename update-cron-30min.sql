-- Run this SQL directly in the Supabase SQL Editor to update the cron schedule

-- First, check existing cron jobs:
SELECT jobname, schedule FROM cron.job;

-- Try to unschedule any existing jobs (ignore errors if they don't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('attendance-reminders-hourly');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Job attendance-reminders-hourly does not exist, skipping...';
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('attendance-reminders-30min');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Job attendance-reminders-30min does not exist, skipping...';
END $$;

-- Schedule attendance reminders every 30 minutes
SELECT cron.schedule(
  'attendance-reminders-30min',
  '*/30 * * * *',  -- Every 30 minutes
  $$SELECT trigger_attendance_reminders()$$
);

-- Verify the new schedule:
SELECT * FROM cron.job WHERE jobname = 'attendance-reminders-30min';
