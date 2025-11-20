-- 1. Ver todas las clases asignadas a Jacobo
SELECT 
  pc.id AS class_id,
  pc.name AS class_name,
  pc.days_of_week,
  pc.start_time,
  pc.is_active,
  pc.start_date,
  pc.end_date,
  cl.name AS club_name,
  cp.status AS participant_status,
  se.full_name
FROM class_participants cp
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
LEFT JOIN clubs cl ON cl.id = pc.club_id
WHERE se.full_name = 'Jacobo Germán Delgado Rubio'
ORDER BY pc.days_of_week, pc.start_time;
