-- Check RLS policies for student_enrollments
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
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'student_enrollments';

-- Test if iron3 can see student enrollments for their class participants
WITH iron3_participants AS (
  SELECT cp.student_enrollment_id
  FROM class_participants cp
  JOIN programmed_classes pc ON pc.id = cp.class_id
  WHERE pc.trainer_profile_id = 'bd464755-a2ea-4759-90fb-e562b6f28884'
    AND cp.status = 'active'
  LIMIT 5
)
SELECT
  se.id,
  se.full_name,
  se.email
FROM student_enrollments se
WHERE se.id IN (SELECT student_enrollment_id FROM iron3_participants);
