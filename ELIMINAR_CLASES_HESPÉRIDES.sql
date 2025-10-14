-- SQL para eliminar todas las clases del club específico
-- IMPORTANTE: Ejecuta esto en tu Supabase SQL Editor

-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610

-- 1. Eliminar registros relacionados primero (para evitar errores de foreign key)

-- Eliminar suscripciones de las clases del club
DELETE FROM class_subscriptions
WHERE class_id IN (
  SELECT id FROM programmed_classes
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
);

-- Eliminar lista de espera de las clases del club
DELETE FROM class_waitlist
WHERE class_id IN (
  SELECT id FROM programmed_classes
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
);

-- Eliminar participantes de las clases del club
DELETE FROM class_participants
WHERE class_id IN (
  SELECT id FROM programmed_classes
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
);

-- 2. Finalmente, eliminar las clases programadas del club
DELETE FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- 3. Verificar que se eliminaron (debe devolver 0)
SELECT COUNT(*) as clases_restantes
FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
