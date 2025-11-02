-- Script para actualizar los grupos de WhatsApp existentes con sus club_id correspondientes
-- Primero, necesitamos ver los clubes y grupos existentes

-- 1. Ver los clubes disponibles y sus IDs
SELECT id, name, club_code
FROM clubs
ORDER BY name;

-- 2. Ver los grupos de WhatsApp existentes
SELECT id, group_name, group_chat_id, club_id, is_active
FROM whatsapp_groups
ORDER BY group_name;

-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecuta las queries de arriba para obtener los IDs de los clubes
-- 2. Identifica el ID del Club Hespérides y del Club KM Padel
-- 3. Reemplaza 'ID_CLUB_HESPERIDES' y 'ID_CLUB_KM_PADEL' con los IDs reales
-- 4. Ejecuta las queries UPDATE de abajo
-- ============================================================================

-- 3. Actualizar grupos del Club Hespérides
-- Asumiendo que los nombres de los grupos son exactos, ajusta si es necesario

UPDATE whatsapp_groups
SET club_id = 'ID_CLUB_HESPERIDES'  -- Reemplazar con el ID real
WHERE group_name IN (
  'Menores Hespérides',
  'Nivel Bronce',
  'Nivel Plata',
  'Nivel Oro'
);

-- 4. Actualizar grupo del Club KM Padel

UPDATE whatsapp_groups
SET club_id = 'ID_CLUB_KM_PADEL'  -- Reemplazar con el ID real
WHERE group_name LIKE '%KM%' OR group_name LIKE '%Padel KM%';
-- Si el nombre es diferente, ajusta la condición WHERE

-- 5. Verificar que todos los grupos tienen club_id asignado
SELECT
  wg.id,
  wg.group_name,
  wg.group_chat_id,
  wg.club_id,
  c.name as club_name,
  wg.is_active
FROM whatsapp_groups wg
LEFT JOIN clubs c ON c.id = wg.club_id
ORDER BY c.name, wg.group_name;

-- 6. Ver grupos que aún no tienen club_id asignado (deberían ser 0)
SELECT id, group_name, group_chat_id
FROM whatsapp_groups
WHERE club_id IS NULL;
