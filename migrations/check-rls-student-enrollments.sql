-- Check RLS policies for student_enrollments table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- Also check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'student_enrollments';

-- Test the actual update with the specific ID
SELECT
  id,
  student_profile_id,
  phone,
  email,
  full_name
FROM student_enrollments
WHERE id = '3f688577-816c-46ed-97e6-45b8240b77ec';
