-- Verificar que mark20 tiene participaciones en class_participants

SELECT
  cp.id,
  cp.student_enrollment_id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed,
  cp.absence_confirmed,
  se.email,
  se.full_name
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'mark20@gmail.com'
  AND cp.status = 'active';
