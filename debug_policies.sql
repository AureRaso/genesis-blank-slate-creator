-- Debug: Check current RLS policies for student_enrollments
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'student_enrollments';

-- Debug: Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'student_enrollments';

-- Debug: Check table structure
\d student_enrollments;