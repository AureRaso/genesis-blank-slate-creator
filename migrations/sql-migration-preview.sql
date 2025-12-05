-- =====================================================
-- PREVIEW: Ver qué registros se van a modificar
-- Ejecutar ANTES de hacer cambios
-- =====================================================

-- 1. Ver clases programadas desde el 20 de enero en adelante
SELECT
  pc.id,
  pc.name,
  pc.start_date,
  pc.end_date,
  pc.days_of_week,
  c.name as club_name
FROM programmed_classes pc
LEFT JOIN clubs c ON c.id = pc.club_id
WHERE pc.start_date >= '2025-01-20'
  AND pc.is_active = true
ORDER BY pc.start_date, pc.name;

-- 2. Ver participantes pendientes de confirmar (estos se van a actualizar)
SELECT
  cp.id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.absence_confirmed,
  cp.confirmed_by_trainer,
  se.full_name as student_name,
  se.email as student_email,
  pc.name as class_name,
  pc.start_date as class_start_date,
  pc.days_of_week
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false)
ORDER BY pc.start_date, pc.name, se.full_name;

-- 3. Contar cuántos registros se van a actualizar
SELECT
  COUNT(*) as total_registros_a_confirmar,
  COUNT(DISTINCT cp.class_id) as clases_afectadas,
  COUNT(DISTINCT cp.student_enrollment_id) as estudiantes_afectados
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- 4. Ver participantes que YA tienen ausencia confirmada (NO se tocarán)
SELECT
  cp.id,
  cp.class_id,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.absence_confirmed = true
ORDER BY pc.start_date, pc.name;

-- 5. Ver participantes que YA están confirmados (NO se tocarán)
SELECT
  cp.id,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NOT NULL
ORDER BY pc.start_date, pc.name;
