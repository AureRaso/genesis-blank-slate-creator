-- Verificar el caso de Javier Luceño en detalle
-- Para entender de dónde salen los números

-- 1. Buscar a Javier Luceño
SELECT id, full_name FROM student_enrollments WHERE full_name ILIKE '%javier luceño%';

-- 2. Ver TODAS sus participaciones en clases
SELECT
  se.full_name,
  pc.name as clase,
  cp.class_id,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.status
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.full_name ILIKE '%javier luceño%'
ORDER BY pc.name, cp.attendance_confirmed_for_date;

-- 3. Contar por clase
SELECT
  se.full_name,
  pc.name as clase,
  cp.class_id,
  COUNT(*) as registros_en_clase,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL) as confirmaciones,
  COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as ausencias
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.full_name ILIKE '%javier luceño%'
  AND cp.status = 'active'
GROUP BY se.full_name, pc.name, cp.class_id
ORDER BY confirmaciones DESC;

-- 4. Verificar la lógica de la función: cuenta confirmaciones de TODAS las clases?
-- Simulamos lo que hace la función
WITH alumno AS (
  SELECT id FROM student_enrollments WHERE full_name ILIKE '%javier luceño%' LIMIT 1
)
SELECT
  'TOTAL GLOBAL (todas las clases)' as scope,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date <= CURRENT_DATE) as confirmaciones,
  COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as ausencias
FROM class_participants cp
WHERE cp.student_enrollment_id = (SELECT id FROM alumno)
  AND cp.status = 'active';

-- 5. Probar la función con diferentes class_ids de Javier
WITH alumno_clases AS (
  SELECT DISTINCT
    cp.student_enrollment_id,
    cp.class_id,
    pc.name as clase_nombre
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  JOIN programmed_classes pc ON cp.class_id = pc.id
  WHERE se.full_name ILIKE '%javier luceño%'
    AND cp.status = 'active'
)
SELECT
  ac.clase_nombre,
  m.total_attended,
  m.late_notice_absences,
  m.early_notice_absences,
  m.total_absences
FROM alumno_clases ac
CROSS JOIN LATERAL get_student_behavior_metrics(ac.student_enrollment_id, ac.class_id) m;
