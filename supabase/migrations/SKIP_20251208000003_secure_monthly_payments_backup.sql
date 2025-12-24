-- =============================================
-- Secure monthly_payments_backup_nov2025 table
-- Security fix: CVE reported by Supabase linter
--
-- This is a backup table that should NOT be accessed
-- through the API. We enable RLS with no policies,
-- effectively blocking all public access.
-- Only direct database access (service_role) can read it.
-- =============================================

-- Enable Row Level Security (blocks all API access when no policies exist)
ALTER TABLE public.monthly_payments_backup_nov2025 ENABLE ROW LEVEL SECURITY;

-- No policies = no access through PostgREST API
-- Only service_role (which bypasses RLS) can access this table

-- Add comment explaining this is a protected backup
COMMENT ON TABLE public.monthly_payments_backup_nov2025 IS 'BACKUP TABLE - November 2025 monthly payments backup. RLS enabled with no policies = blocked from public API access. Only accessible via direct DB connection.';

-- =============================================
-- ALTERNATIVE: If you want to delete this table
-- instead of just protecting it, uncomment below:
-- =============================================
-- DROP TABLE IF EXISTS public.monthly_payments_backup_nov2025;
