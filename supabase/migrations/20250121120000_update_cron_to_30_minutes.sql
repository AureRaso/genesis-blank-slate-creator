-- =====================================================
-- Update Cron Job for Attendance Reminders
-- Change from hourly to every 30 minutes
-- =====================================================

-- First, check existing cron jobs (run this to see what exists):
-- SELECT jobname, schedule FROM cron.job;

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
-- Cron format: minute hour day month weekday
-- Runs at :00 and :30 minutes of every hour
SELECT cron.schedule(
  'attendance-reminders-30min',
  '*/30 * * * *',  -- Every 30 minutes
  $$SELECT trigger_attendance_reminders()$$
);

-- Update comment on function (if exists)
DO $$
BEGIN
  COMMENT ON FUNCTION trigger_attendance_reminders IS 'Triggers attendance reminder emails and WhatsApp messages for classes starting in 24 hours. Runs every 30 minutes.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Function trigger_attendance_reminders does not exist';
END $$;

-- Query to verify the new schedule:
-- SELECT * FROM cron.job WHERE jobname = 'attendance-reminders-30min';
