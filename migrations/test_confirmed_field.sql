-- Simple test: Select a few class participants with the new field
SELECT 
  id,
  student_enrollment_id,
  attendance_confirmed_at,
  confirmed_by_trainer,
  absence_confirmed
FROM class_participants
WHERE attendance_confirmed_at IS NOT NULL
LIMIT 5;
