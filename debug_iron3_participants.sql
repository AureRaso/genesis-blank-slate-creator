-- Check if iron3 can see participants for their classes
-- First, get a class ID for iron3
WITH iron3_classes AS (
  SELECT pc.id
  FROM programmed_classes pc
  WHERE pc.trainer_profile_id = 'bd464755-a2ea-4759-90fb-e562b6f28884'
    AND pc.days_of_week @> ARRAY['lunes']::text[]
  LIMIT 1
)
SELECT
  cp.id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.status,
  se.full_name,
  se.email
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE cp.class_id IN (SELECT id FROM iron3_classes)
  AND cp.status = 'active';

-- Check RLS policies for class_participants
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
