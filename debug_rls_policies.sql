-- ============================================================================
-- DEBUG: Check current RLS policies on class_participants
-- Run this in Supabase SQL Editor to see what policies are active
-- ============================================================================

-- 1. Check all policies on class_participants table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'class_participants'
ORDER BY policyname;

-- 2. Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'class_participants';

-- 3. Check the is_my_enrollment function exists and its definition
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_my_enrollment';

-- 4. Get function source
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'is_my_enrollment';
