-- ============================================================================
-- MIGRATION: Create Cron Job for Automatic Monthly Payment Generation
-- ============================================================================
-- PURPOSE: Schedule daily execution at 00:05 UTC to generate payments
--          for rates whose billing_day matches the current day.
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- Schedule the payment generation cron job
-- ============================================================================
-- Runs daily at 00:05 UTC (01:05 Spain winter, 02:05 Spain summer)
-- This ensures payments are generated early in the day for the billing day
-- Cron format: minute hour day month weekday
SELECT cron.schedule(
  'generate-monthly-payments',
  '5 0 * * *',  -- Daily at 00:05 UTC
  $$SELECT trigger_monthly_payment_generation()$$
);

-- ============================================================================
-- Comments and documentation
-- ============================================================================
COMMENT ON FUNCTION trigger_monthly_payment_generation IS
'Trigger function called by pg_cron daily at 00:05 UTC.
Generates payments for rates whose billing_day matches the current day.
Uses pre-pay model: payments are generated for the CURRENT month.
Example: On March 1st, generates payments for March for all rates with billing_day=1.';

-- ============================================================================
-- Helpful queries for managing the cron job
-- ============================================================================

-- Query to check scheduled cron jobs:
-- SELECT * FROM cron.job WHERE jobname = 'generate-monthly-payments';

-- Query to check job execution history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-monthly-payments') ORDER BY start_time DESC LIMIT 10;

-- Query to check payment generation logs:
-- SELECT * FROM payment_generation_logs ORDER BY executed_at DESC LIMIT 10;

-- To manually trigger (for testing):
-- SELECT trigger_monthly_payment_generation();

-- To manually generate for a specific billing day:
-- SELECT auto_generate_monthly_payments(1); -- For billing_day = 1

-- To manually generate for a specific month/year:
-- SELECT auto_generate_monthly_payments(1, 3, 2025); -- billing_day=1, March 2025

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('generate-monthly-payments');
