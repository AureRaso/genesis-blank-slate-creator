-- Step 1: See all current policies on account_dependents
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'account_dependents';

-- Step 2: See all current policies on student_enrollments
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'student_enrollments';
