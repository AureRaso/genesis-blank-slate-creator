-- Check if attendance_confirmed_for_date and absence_confirmed can coexist
-- This will show us if we need to exclude absences from attendance count

SELECT
  se.email,
  pc.name as class_name,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.absence_confirmed_at,
  CASE
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.absence_confirmed = true THEN 'BOTH (conflicto)'
    WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN 'Solo asistencia'
    WHEN cp.absence_confirmed = true THEN 'Solo ausencia'
    ELSE 'Ninguno'
  END as status
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
  AND (cp.attendance_confirmed_for_date IS NOT NULL OR cp.absence_confirmed = true)
ORDER BY cp.attendance_confirmed_for_date DESC NULLS LAST;

-- Summary count
SELECT
  CASE
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.absence_confirmed = true THEN 'Ambos (conflicto)'
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.absence_confirmed = false THEN 'Solo asistencia confirmada'
    WHEN cp.absence_confirmed = true THEN 'Solo ausencia'
    ELSE 'Otro'
  END as tipo,
  COUNT(*) as cantidad
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
GROUP BY tipo;
