-- Asignar niveles a los grupos de WhatsApp existentes de Club Hespérides
-- Nivel 1 = Bronce (principiantes)
-- Nivel 2 = Plata (intermedios)
-- Nivel 3 = Oro (avanzados)
-- Nivel 4 = Menores

-- Grupo Nivel Bronce -> Nivel 1
UPDATE whatsapp_groups
SET level_target = 1
WHERE group_name = 'Nivel Bronce Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Grupo Nivel Plata -> Nivel 2
UPDATE whatsapp_groups
SET level_target = 2
WHERE group_name = 'Nivel Plata Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Grupo Nivel Oro -> Nivel 3
UPDATE whatsapp_groups
SET level_target = 3
WHERE group_name = 'Nivel Oro Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Grupo Menores -> Nivel 4
UPDATE whatsapp_groups
SET level_target = 4
WHERE group_name = 'Menores Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Verificar los cambios
SELECT
  group_name,
  level_target,
  CASE level_target
    WHEN 1 THEN 'Bronce (Principiantes)'
    WHEN 2 THEN 'Plata (Intermedios)'
    WHEN 3 THEN 'Oro (Avanzados)'
    WHEN 4 THEN 'Menores'
    ELSE 'Sin nivel asignado'
  END as nivel_descripcion,
  is_active,
  group_chat_id
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY level_target;
