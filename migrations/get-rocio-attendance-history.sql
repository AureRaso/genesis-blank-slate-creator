-- Get attendance history for Rocío Romero in Viernes - Pista 2 class

-- First, let's check if the attendance_history table exists and has data
SELECT
  'Attendance History Records' as query_name,
  ah.id,
  ah.scheduled_date,
  ah.action_type,
  ah.changed_by_role,
  ah.previous_absence_confirmed,
  ah.previous_absence_reason,
  ah.new_absence_confirmed,
  ah.new_absence_reason,
  ah.previous_attendance_confirmed,
  ah.new_attendance_confirmed,
  ah.created_at,
  p.full_name as changed_by_name,
  se.full_name as student_name,
  pc.name as class_name
FROM attendance_history ah
JOIN class_participants cp ON ah.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN profiles p ON ah.changed_by = p.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.id = 'f0da12f4-40cf-446e-8d8d-0cdc30852117'  -- Rocío Romero's student_enrollment_id
  AND cp.class_id = '5d6d27bb-06bc-43e1-95f6-cc927573f2a3'  -- Viernes - Pista 2 class
ORDER BY ah.created_at DESC;

-- If the table doesn't exist yet, this query will fail
-- In that case, you need to run the migration first:
-- npx supabase db push
