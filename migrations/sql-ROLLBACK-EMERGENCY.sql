-- =====================================================
-- 🚨 ROLLBACK DE EMERGENCIA 🚨
-- Revertir confirmaciones automáticas
-- =====================================================

-- ⚠️ IMPORTANTE: Este script revierte TODAS las confirmaciones
-- automáticas hechas desde el cambio de sistema
--
-- Solo ejecuta esto si algo salió mal y necesitas volver atrás

-- =====================================================
-- OPCIÓN 1: Revertir SOLO club Gali
-- =====================================================

BEGIN;

UPDATE class_participants cp
SET
  attendance_confirmed_for_date = NULL,
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = NULL
FROM programmed_classes pc
INNER JOIN clubs c ON c.id = pc.club_id
WHERE cp.class_id = pc.id
  AND c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'  -- Gali
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.confirmed_by_trainer = false  -- Solo revertir auto-confirmados
  AND cp.absence_confirmed IS NOT TRUE;  -- No tocar ausencias

-- Ver cuántos se revirtieron
SELECT COUNT(*) as registros_revertidos_gali
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND cp.attendance_confirmed_at IS NULL;

-- Si todo está bien:
COMMIT;
-- Si algo salió mal:
-- ROLLBACK;


-- =====================================================
-- OPCIÓN 2: Revertir SOLO club Hespérides
-- =====================================================

BEGIN;

UPDATE class_participants cp
SET
  attendance_confirmed_for_date = NULL,
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = NULL
FROM programmed_classes pc
INNER JOIN clubs c ON c.id = pc.club_id
WHERE cp.class_id = pc.id
  AND c.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Hespérides
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.confirmed_by_trainer = false  -- Solo revertir auto-confirmados
  AND cp.absence_confirmed IS NOT TRUE;  -- No tocar ausencias

-- Ver cuántos se revirtieron
SELECT COUNT(*) as registros_revertidos_hesperides
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND cp.attendance_confirmed_at IS NULL;

-- Si todo está bien:
COMMIT;
-- Si algo salió mal:
-- ROLLBACK;


-- =====================================================
-- OPCIÓN 3: Revertir AMBOS clubes (Gali + Hespérides)
-- =====================================================

BEGIN;

UPDATE class_participants cp
SET
  attendance_confirmed_for_date = NULL,
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = NULL
FROM programmed_classes pc
INNER JOIN clubs c ON c.id = pc.club_id
WHERE cp.class_id = pc.id
  AND c.id IN (
    'cc0a5265-99c5-4b99-a479-5334280d0c6d',  -- Gali
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'   -- Hespérides
  )
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.confirmed_by_trainer = false  -- Solo revertir auto-confirmados
  AND cp.absence_confirmed IS NOT TRUE;  -- No tocar ausencias

-- Ver cuántos se revirtieron en total
SELECT
  c.name as club_name,
  COUNT(*) as registros_revertidos
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id IN (
    'cc0a5265-99c5-4b99-a479-5334280d0c6d',
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  )
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
GROUP BY c.name;

-- Si todo está bien:
COMMIT;
-- Si algo salió mal:
-- ROLLBACK;


-- =====================================================
-- OPCIÓN 4: Revertir por FECHA ESPECÍFICA (más seguro)
-- =====================================================
-- Si solo quieres revertir cambios hechos en los últimos X minutos

BEGIN;

UPDATE class_participants cp
SET
  attendance_confirmed_for_date = NULL,
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = NULL
FROM programmed_classes pc
INNER JOIN clubs c ON c.id = pc.club_id
WHERE cp.class_id = pc.id
  AND c.id IN (
    'cc0a5265-99c5-4b99-a479-5334280d0c6d',  -- Gali
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'   -- Hespérides
  )
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.confirmed_by_trainer = false
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '10 minutes'  -- Solo últimos 10 min
  AND cp.absence_confirmed IS NOT TRUE;

-- Ver cuántos se revirtieron
SELECT COUNT(*) as registros_revertidos_ultimos_10min
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id IN (
    'cc0a5265-99c5-4b99-a479-5334280d0c6d',
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  )
  AND pc.start_date >= '2025-11-20'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL;

-- Si todo está bien:
COMMIT;
-- Si algo salió mal:
-- ROLLBACK;
