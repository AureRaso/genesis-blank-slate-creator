-- ============================================================================
-- TEMPORARY: Disable RLS on class_participants for debugging
-- This will allow ALL users to access ALL data temporarily
-- USE ONLY FOR DEBUGGING - DO NOT USE IN PRODUCTION
-- ============================================================================

-- Disable RLS on class_participants
ALTER TABLE public.class_participants DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'class_participants';

-- Show message
SELECT 'RLS has been DISABLED on class_participants table. This is TEMPORARY for debugging only.' as warning;
