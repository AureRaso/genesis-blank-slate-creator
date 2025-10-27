-- Añadir los 4 grupos de WhatsApp para el club Hespérides
-- Club ID Hespérides: 7b6f49ae-d496-407b-bca1-f5f1e9370610

-- 1. Primero, ver los grupos existentes para Hespérides
SELECT
  id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_at
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY created_at;

-- 2. Eliminar grupos existentes si quieres empezar desde cero (OPCIONAL)
-- DELETE FROM whatsapp_groups WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- 3. Insertar los 4 nuevos grupos
-- IMPORTANTE: Los group_chat_id están como 'PENDING' hasta que configures Whapi
-- Una vez tengas los IDs reales de WhatsApp, actualízalos con el query del paso 5

INSERT INTO whatsapp_groups (
  club_id,
  group_name,
  group_chat_id,
  description,
  is_active,
  trainer_profile_id
) VALUES
  (
    '7b6f49ae-d496-407b-bca1-f5f1e9370610',
    'Menores Hespérides',
    'PENDING_MENORES',
    'Grupo de jugadores menores del club Hespérides',
    true,
    NULL
  ),
  (
    '7b6f49ae-d496-407b-bca1-f5f1e9370610',
    'Nivel Bronce Hespérides',
    'PENDING_BRONCE',
    'Grupo de nivel bronce (principiantes) del club Hespérides',
    true,
    NULL
  ),
  (
    '7b6f49ae-d496-407b-bca1-f5f1e9370610',
    'Nivel Plata Hespérides',
    'PENDING_PLATA',
    'Grupo de nivel plata (intermedios) del club Hespérides',
    true,
    NULL
  ),
  (
    '7b6f49ae-d496-407b-bca1-f5f1e9370610',
    'Nivel Oro Hespérides',
    'PENDING_ORO',
    'Grupo de nivel oro (avanzados) del club Hespérides',
    true,
    NULL
  )
ON CONFLICT (group_chat_id) DO NOTHING;

-- 4. Verificar que se insertaron correctamente
SELECT
  id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_at
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY
  CASE
    WHEN group_name LIKE '%Menores%' THEN 1
    WHEN group_name LIKE '%Bronce%' THEN 2
    WHEN group_name LIKE '%Plata%' THEN 3
    WHEN group_name LIKE '%Oro%' THEN 4
    ELSE 5
  END;

-- 5. Cuando tengas los IDs reales de WhatsApp, actualízalos así:
-- (Descomenta y reemplaza con los IDs reales)

/*
UPDATE whatsapp_groups
SET group_chat_id = '34XXXXXXXXX-MENORES@g.us'
WHERE group_name = 'Menores Hespérides'
AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

UPDATE whatsapp_groups
SET group_chat_id = '34XXXXXXXXX-BRONCE@g.us'
WHERE group_name = 'Nivel Bronce Hespérides'
AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

UPDATE whatsapp_groups
SET group_chat_id = '34XXXXXXXXX-PLATA@g.us'
WHERE group_name = 'Nivel Plata Hespérides'
AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

UPDATE whatsapp_groups
SET group_chat_id = '34XXXXXXXXX-ORO@g.us'
WHERE group_name = 'Nivel Oro Hespérides'
AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
*/

-- 6. Para obtener los IDs de grupos de WhatsApp desde Whapi:
-- GET https://gate.whapi.cloud/groups
-- Copia los IDs (formato: 34XXXXXXXXX-YYYYYYYY@g.us) y actualiza con el query anterior

-- 7. Verificación final
SELECT
  id,
  group_name,
  group_chat_id,
  CASE
    WHEN group_chat_id LIKE 'PENDING%' THEN '⚠️ Pendiente de configurar'
    ELSE '✅ Configurado'
  END as status,
  is_active
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY
  CASE
    WHEN group_name LIKE '%Menores%' THEN 1
    WHEN group_name LIKE '%Bronce%' THEN 2
    WHEN group_name LIKE '%Plata%' THEN 3
    WHEN group_name LIKE '%Oro%' THEN 4
    ELSE 5
  END;
