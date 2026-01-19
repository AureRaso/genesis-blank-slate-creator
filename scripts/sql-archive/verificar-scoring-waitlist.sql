-- =====================================================
-- VERIFICACIÓN DEL SCORING DE LISTA DE ESPERA
-- Comprobamos si la lógica de get_student_behavior_metrics es correcta
-- =====================================================

-- 1. Primero veamos algunos alumnos con sus datos crudos
SELECT
  se.full_name,
  cp.class_id,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.absence_confirmed,
  cp.absence_confirmed_at,
  cp.status
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.status = 'active'
ORDER BY se.full_name
LIMIT 20;

-- 2. Ahora veamos un resumen por alumno
SELECT
  se.full_name,
  COUNT(*) as total_participaciones,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL) as confirmaciones_asistencia,
  COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as ausencias_confirmadas,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL AND cp.absence_confirmed = true) as AMBOS_A_LA_VEZ
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.status = 'active'
GROUP BY se.id, se.full_name
HAVING COUNT(*) > 3
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 3. Verificar si hay casos donde AMBOS campos están activos (no debería haber)
SELECT
  se.full_name,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.absence_confirmed_at
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.attendance_confirmed_for_date IS NOT NULL
  AND cp.absence_confirmed = true
LIMIT 10;

-- 4. Probar la función get_student_behavior_metrics con un alumno específico
-- Primero obtener un student_enrollment_id y class_id de ejemplo
WITH sample_student AS (
  SELECT
    cp.student_enrollment_id,
    cp.class_id,
    se.full_name
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE cp.status = 'active'
  LIMIT 1
)
SELECT
  ss.full_name,
  ss.student_enrollment_id,
  ss.class_id,
  m.*
FROM sample_student ss
CROSS JOIN LATERAL get_student_behavior_metrics(ss.student_enrollment_id, ss.class_id) m;

-- 5. Comparar manualmente los conteos vs lo que devuelve la función
-- para varios alumnos
WITH student_manual_counts AS (
  SELECT
    cp.student_enrollment_id,
    se.full_name,
    COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date <= CURRENT_DATE) as manual_confirmaciones,
    COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as manual_ausencias
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE cp.status = 'active'
  GROUP BY cp.student_enrollment_id, se.full_name
  HAVING COUNT(*) > 2
  ORDER BY COUNT(*) DESC
  LIMIT 10
)
SELECT
  smc.full_name,
  smc.manual_confirmaciones,
  smc.manual_ausencias,
  smc.manual_confirmaciones as "deberia_ser_attended",
  (smc.manual_confirmaciones - smc.manual_ausencias) as "calculo_actual_funcion",
  CASE
    WHEN smc.manual_confirmaciones != (smc.manual_confirmaciones - smc.manual_ausencias)
    THEN '⚠️ DIFERENCIA'
    ELSE '✅ OK'
  END as verificacion
FROM student_manual_counts smc;

-- 6. Verificar la función real con múltiples alumnos
WITH active_students AS (
  SELECT DISTINCT
    cp.student_enrollment_id,
    cp.class_id,
    se.full_name
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE cp.status = 'active'
  LIMIT 10
)
SELECT
  ast.full_name,
  m.total_attended,
  m.late_notice_absences,
  m.early_notice_absences,
  m.total_absences,
  m.club_cancelled_classes,
  (m.total_attended + m.late_notice_absences + m.early_notice_absences) as "suma_total_acciones"
FROM active_students ast
CROSS JOIN LATERAL get_student_behavior_metrics(ast.student_enrollment_id, ast.class_id) m;
