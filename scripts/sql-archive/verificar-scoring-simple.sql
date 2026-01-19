-- =====================================================
-- VERIFICACIÓN DEL SCORING DE LISTA DE ESPERA
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. ¿Hay casos donde AMBOS campos están activos a la vez?
-- (No debería haber ninguno si son mutuamente excluyentes)
SELECT
  'CASOS CON AMBOS CAMPOS ACTIVOS' as test,
  COUNT(*) as cantidad
FROM class_participants
WHERE attendance_confirmed_for_date IS NOT NULL
  AND absence_confirmed = true;

-- 2. Conteos manuales por alumno (top 15 más activos)
SELECT
  se.full_name,
  COUNT(*) as total_clases,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL) as confirmaciones_asistencia,
  COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as ausencias_confirmadas
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.status = 'active'
GROUP BY se.id, se.full_name
HAVING COUNT(*) >= 3
ORDER BY COUNT(*) DESC
LIMIT 15;

-- 3. Comparar función vs conteo manual para un alumno con ausencias
WITH alumno_ejemplo AS (
  SELECT
    cp.student_enrollment_id,
    cp.class_id,
    se.full_name,
    COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date <= CURRENT_DATE) as manual_confirmaciones,
    COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as manual_ausencias
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE cp.status = 'active'
  GROUP BY cp.student_enrollment_id, cp.class_id, se.full_name
  HAVING COUNT(*) FILTER (WHERE cp.absence_confirmed = true) > 0
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
SELECT
  ae.full_name,
  ae.manual_confirmaciones,
  ae.manual_ausencias,
  m.total_attended as funcion_attended,
  m.late_notice_absences as funcion_late,
  m.early_notice_absences as funcion_early,
  m.total_absences as funcion_total_abs,
  CASE
    WHEN m.total_attended = ae.manual_confirmaciones THEN '✅ CORRECTO'
    WHEN m.total_attended = ae.manual_confirmaciones - (m.late_notice_absences + m.early_notice_absences) THEN '⚠️ RESTA AUSENCIAS (revisar)'
    ELSE '❓ DIFERENCIA INESPERADA'
  END as analisis
FROM alumno_ejemplo ae
CROSS JOIN LATERAL get_student_behavior_metrics(ae.student_enrollment_id, ae.class_id) m;

-- 4. Ver detalle de un alumno con ausencias
SELECT
  se.full_name,
  pc.name as clase,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  CASE
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.absence_confirmed = true THEN '🚨 AMBOS!'
    WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN '✅ Confirmó asistencia'
    WHEN cp.absence_confirmed = true THEN '❌ Confirmó ausencia'
    ELSE '⚪ Sin confirmar'
  END as estado
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.status = 'active'
  AND cp.student_enrollment_id IN (
    SELECT student_enrollment_id
    FROM class_participants
    WHERE absence_confirmed = true AND status = 'active'
    GROUP BY student_enrollment_id
    HAVING COUNT(*) > 0
    LIMIT 1
  )
ORDER BY se.full_name, pc.name;

-- 5. Resumen global de la lógica
SELECT
  'RESUMEN GLOBAL' as info,
  COUNT(*) as total_participantes_activos,
  COUNT(*) FILTER (WHERE attendance_confirmed_for_date IS NOT NULL) as con_asistencia_confirmada,
  COUNT(*) FILTER (WHERE absence_confirmed = true) as con_ausencia_confirmada,
  COUNT(*) FILTER (WHERE attendance_confirmed_for_date IS NOT NULL AND absence_confirmed = true) as con_AMBOS,
  COUNT(*) FILTER (WHERE attendance_confirmed_for_date IS NULL AND absence_confirmed IS NOT TRUE) as sin_confirmar_nada
FROM class_participants
WHERE status = 'active';
