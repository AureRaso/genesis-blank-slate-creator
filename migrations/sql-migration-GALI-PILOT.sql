-- =====================================================
-- PRUEBA PILOTO: Club Gali
-- Actualizar registros desde 2025-11-20 en adelante
-- Club ID: cc0a5265-99c5-4b99-a479-5334280d0c6d
-- =====================================================

-- =====================================================
-- PASO 1: PREVIEW - Ver qué se va a actualizar en GALI
-- =====================================================

-- 1.1 Ver clases programadas de Gali desde 2025-11-20
SELECT
  pc.id,
  pc.name,
  pc.start_date,
  pc.end_date,
  pc.days_of_week,
  c.name as club_name
FROM programmed_classes pc
LEFT JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND pc.is_active = true
ORDER BY pc.start_date, pc.name;

-- 1.2 Ver participantes pendientes de confirmar en Gali
SELECT
  cp.id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.absence_confirmed,
  se.full_name as student_name,
  se.email as student_email,
  pc.name as class_name,
  pc.start_date as class_start_date,
  c.name as club_name
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false)
ORDER BY pc.start_date, pc.name, se.full_name;

-- 1.3 Contar registros que se van a actualizar en Gali
SELECT
  COUNT(*) as total_registros_a_confirmar,
  COUNT(DISTINCT cp.class_id) as clases_afectadas,
  COUNT(DISTINCT cp.student_enrollment_id) as estudiantes_afectados
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- 1.4 Ver participantes que YA tienen ausencia confirmada (NO se tocarán)
SELECT
  cp.id,
  cp.absence_confirmed,
  cp.absence_reason,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date,
  c.name as club_name
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.absence_confirmed = true
ORDER BY pc.start_date, pc.name;

-- =====================================================
-- PASO 2: EJECUTAR - Actualizar solo club Gali
-- =====================================================

BEGIN;

-- Actualizar participantes pendientes a confirmados (SOLO GALI)
UPDATE class_participants cp
SET
  attendance_confirmed_for_date = pc.start_date,
  attendance_confirmed_at = NOW(),
  confirmed_by_trainer = false  -- Auto-confirmado por el sistema
FROM programmed_classes pc
INNER JOIN clubs c ON c.id = pc.club_id
WHERE cp.class_id = pc.id
  AND c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'  -- Solo club Gali
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- =====================================================
-- PASO 3: VERIFICAR - Comprobar actualización
-- =====================================================

-- Ver registros recién actualizados
SELECT
  cp.id,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.confirmed_by_trainer,
  c.name as club_name
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NOT NULL
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '2 minutes'
ORDER BY pc.start_date, pc.name;

-- Contar registros actualizados
SELECT
  COUNT(*) as registros_actualizados_ahora
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NOT NULL
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '2 minutes';

-- =====================================================
-- PASO 4: CONFIRMAR O REVERTIR
-- =====================================================

-- Si todo se ve bien, ejecuta:
-- COMMIT;

-- Si algo salió mal, ejecuta:
-- ROLLBACK;
