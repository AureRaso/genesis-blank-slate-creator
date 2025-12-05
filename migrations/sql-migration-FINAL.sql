-- =====================================================
-- ACTUALIZACIÓN FINAL: Confirmar todos los registros pendientes
-- Desde 2025-01-20 en adelante
-- =====================================================

-- PASO 1: PREVIEW - Ver cuántos registros se van a actualizar
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

-- RESULTADO ESPERADO: Deberías ver un número razonable de registros
-- Si el número parece incorrecto, DETENTE y revisa

-- =====================================================
-- PASO 2: EJECUTAR - Actualizar registros
-- =====================================================

BEGIN;

-- Actualizar todos los participantes pendientes a confirmados
UPDATE class_participants cp
SET
  attendance_confirmed_for_date = pc.start_date,
  attendance_confirmed_at = NOW(),
  confirmed_by_trainer = false  -- Auto-confirmado por el sistema
FROM programmed_classes pc
WHERE cp.class_id = pc.id
  AND pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- PASO 3: VERIFICAR - Comprobar que se actualizaron correctamente
SELECT
  COUNT(*) as registros_actualizados_ahora
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NOT NULL
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '2 minutes';

-- Si el número coincide con el PASO 1, ejecuta COMMIT
-- Si algo no cuadra, ejecuta ROLLBACK

-- COMMIT;  -- Descomenta esta línea cuando estés seguro
-- ROLLBACK;  -- O esta si quieres deshacer
