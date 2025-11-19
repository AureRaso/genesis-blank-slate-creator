-- =====================================================
-- EJECUTAR: Actualizar registros pendientes a confirmados
-- Desde 2025-01-20 en adelante
-- =====================================================

-- IMPORTANTE: Este SQL solo actualiza registros que:
-- 1. Están activos (status = 'active')
-- 2. Pertenecen a clases desde 2025-01-20 en adelante
-- 3. NO tienen attendance_confirmed_for_date (están pendientes)
-- 4. NO tienen absence_confirmed = true (no están rechazados)

BEGIN;

-- Actualizar participantes pendientes a confirmados
UPDATE class_participants cp
SET
  attendance_confirmed_for_date = pc.start_date,
  attendance_confirmed_at = NOW(),
  confirmed_by_trainer = false  -- Auto-confirmado por sistema
FROM programmed_classes pc
WHERE cp.class_id = pc.id
  AND pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- Verificar cuántos registros se actualizaron
SELECT
  COUNT(*) as registros_actualizados
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.start_date >= '2025-01-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NOT NULL
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '1 minute';

-- Si todo se ve bien, ejecuta:
COMMIT;

-- Si algo salió mal, ejecuta:
-- ROLLBACK;
