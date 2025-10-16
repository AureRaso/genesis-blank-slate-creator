-- SQL para añadir un segundo grupo de WhatsApp para el club Hespérides
-- Ejecuta esto en tu Supabase SQL Editor

-- Club ID Hespérides: 7b6f49ae-d496-407b-bca1-f5f1e9370610

-- 1. Primero, ver los grupos existentes para Hespérides
SELECT * FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- 2. Insertar nuevo grupo de WhatsApp
-- IMPORTANTE: Reemplaza 'TU_GROUP_CHAT_ID_AQUI' con el ID real del grupo de WhatsApp
-- El group_chat_id lo obtienes del canal de WhatsApp (formato: 123456789@g.us o similar)

INSERT INTO whatsapp_groups (
  club_id,
  group_chat_id,
  group_name,
  is_active,
  trainer_profile_id
) VALUES (
  '7b6f49ae-d496-407b-bca1-f5f1e9370610',  -- Club Hespérides
  'TU_GROUP_CHAT_ID_AQUI',                  -- Reemplazar con el ID real del grupo
  'Hespérides Nivel Avanzado',             -- Nombre descriptivo del grupo (puedes cambiarlo)
  true,                                     -- Activo
  NULL                                      -- Sin profesor específico (para todos)
);

-- 3. Verificar que se insertó correctamente
SELECT
  id,
  group_name,
  group_chat_id,
  is_active,
  club_id,
  created_at
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY created_at DESC;

-- NOTAS:
-- - Si quieres asociar el grupo a un profesor específico, reemplaza NULL por el profile_id del profesor
-- - Puedes cambiar el group_name a algo más descriptivo como:
--   * 'Hespérides Principiantes'
--   * 'Hespérides Nivel Intermedio'
--   * 'Hespérides Nivel Avanzado'
--   * 'Hespérides Lunes y Miércoles'
--   * etc.
