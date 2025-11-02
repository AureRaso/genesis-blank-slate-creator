-- Script para actualizar todas las clases programadas existentes
-- Pone is_open = false por defecto para todas las clases

-- Verificar estado actual
SELECT
  id,
  name,
  is_open,
  is_active,
  max_participants,
  (SELECT COUNT(*)
   FROM class_participants cp
   WHERE cp.class_id = pc.id AND cp.status = 'active') as active_participants
FROM programmed_classes pc
WHERE is_active = true
ORDER BY created_at DESC;

-- Actualizar todas las clases existentes para que is_open = false
UPDATE programmed_classes
SET is_open = false
WHERE is_open IS NULL OR is_open = true;

-- Verificar resultado
SELECT
  id,
  name,
  is_open,
  is_active,
  max_participants,
  (SELECT COUNT(*)
   FROM class_participants cp
   WHERE cp.class_id = pc.id AND cp.status = 'active') as active_participants
FROM programmed_classes pc
WHERE is_active = true
ORDER BY created_at DESC;

-- Contar total de clases actualizadas
SELECT
  COUNT(*) as total_clases,
  SUM(CASE WHEN is_open = false THEN 1 ELSE 0 END) as clases_cerradas,
  SUM(CASE WHEN is_open = true THEN 1 ELSE 0 END) as clases_abiertas
FROM programmed_classes
WHERE is_active = true;
