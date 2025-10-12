-- ============================================================================
-- Check ALL RLS policies that might be causing recursion
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Check policies on programmed_classes
SELECT
    'programmed_classes' as table_name,
    policyname,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'programmed_classes'
ORDER BY policyname;

-- 2. Check policies on class_participants
SELECT
    'class_participants' as table_name,
    policyname,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'class_participants'
ORDER BY policyname;

-- 3. Check policies on student_enrollments
SELECT
    'student_enrollments' as table_name,
    policyname,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- 4. List all SECURITY DEFINER functions
SELECT
    routine_name,
    routine_type,
    security_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND security_type = 'DEFINER'
ORDER BY routine_name;
