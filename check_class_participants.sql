-- Check if class participants exist for TestNiños1 class

-- First, find the class
SELECT id, name, created_at, trainer_profile_id, club_id
FROM programmed_classes
WHERE name LIKE '%TestNiños%'
ORDER BY created_at DESC
LIMIT 5;

-- Check class_participants for the children's enrollment IDs
SELECT
  cp.id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.status,
  se.full_name,
  se.email,
  se.student_profile_id,
  pc.name as class_name
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.student_profile_id IN (
  '2953b895-5dab-4e9c-81c1-961efc857749',  -- Maria
  'a5e08b29-79c8-43d5-b534-a9b1cd246a8f'   -- Hijo2
)
ORDER BY cp.created_at DESC;

-- Show all student_enrollments for the children
SELECT id, full_name, email, student_profile_id, club_id
FROM student_enrollments
WHERE student_profile_id IN (
  '2953b895-5dab-4e9c-81c1-961efc857749',  -- Maria
  'a5e08b29-79c8-43d5-b534-a9b1cd246a8f'   -- Hijo2
);
