-- Mark Paula Padilla as absent for Jueves - Pista 2 on 2025-12-04 at 19:00

-- Update Paula's participant record to mark her as absent
UPDATE class_participants
SET
  absence_confirmed = true,
  absence_confirmed_at = NOW(),
  absence_reason = 'Test - Marcado manualmente para debug',
  attendance_confirmed_for_date = NULL,  -- Clear attendance confirmation
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = false
WHERE id = 'd030b456-bd70-4708-a9f1-8210a45c5ba3';

-- Verify the update
SELECT
  'Paula after update' as query_name,
  cp.id as participant_id,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_time,
  pc.start_date,
  cp.status,
  cp.is_substitute,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.confirmed_by_trainer
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.id = 'd030b456-bd70-4708-a9f1-8210a45c5ba3';
