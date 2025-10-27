-- ============================================================================
-- ACTUALIZAR IDs DE GRUPOS DE WHATSAPP PARA HESPÉRIDES
-- ============================================================================
-- Ejecuta este SQL cuando tengas los IDs reales de WhatsApp de Whapi
-- Los IDs tienen formato: 34XXXXXXXXX-YYYYYYYY@g.us
--
-- Para obtener los IDs:
-- 1. Escanea QR en Whapi con tu número
-- 2. Agrega ese número a los 4 grupos de WhatsApp
-- 3. GET https://gate.whapi.cloud/groups
-- 4. Copia los IDs y pégalos abajo
-- ============================================================================

-- PASO 1: Ver los grupos actuales (PENDING)
SELECT
  id,
  group_name,
  group_chat_id as id_actual,
  '👉 Reemplazar con ID real' as accion
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY group_name;

-- ============================================================================
-- PASO 2: ACTUALIZAR IDs (Reemplaza 'TU_ID_AQUI' con los IDs reales)
-- ============================================================================

-- Grupo: Menores Hespérides
UPDATE whatsapp_groups
SET
  group_chat_id = 'TU_ID_MENORES_AQUI',  -- 👈 Reemplaza esto
  updated_at = NOW()
WHERE
  group_name = 'Menores Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Grupo: Nivel Bronce Hespérides
UPDATE whatsapp_groups
SET
  group_chat_id = 'TU_ID_BRONCE_AQUI',  -- 👈 Reemplaza esto
  updated_at = NOW()
WHERE
  group_name = 'Nivel Bronce Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Grupo: Nivel Plata Hespérides
UPDATE whatsapp_groups
SET
  group_chat_id = 'TU_ID_PLATA_AQUI',  -- 👈 Reemplaza esto
  updated_at = NOW()
WHERE
  group_name = 'Nivel Plata Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Grupo: Nivel Oro Hespérides
UPDATE whatsapp_groups
SET
  group_chat_id = 'TU_ID_ORO_AQUI',  -- 👈 Reemplaza esto
  updated_at = NOW()
WHERE
  group_name = 'Nivel Oro Hespérides'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- ============================================================================
-- PASO 3: VERIFICAR QUE SE ACTUALIZARON CORRECTAMENTE
-- ============================================================================

SELECT
  group_name as "Grupo",
  group_chat_id as "ID de WhatsApp",
  CASE
    WHEN group_chat_id LIKE 'PENDING%' THEN '❌ Pendiente'
    WHEN group_chat_id LIKE 'TU_ID%' THEN '⚠️ No actualizado'
    ELSE '✅ Configurado'
  END as "Estado",
  is_active as "Activo",
  updated_at as "Última actualización"
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

-- ============================================================================
-- EJEMPLO DE CÓMO DEBERÍAN VERSE LOS IDs:
-- ============================================================================
-- ID real de WhatsApp:     120363318449147474@g.us
-- ID con código de país:   34654321098-1234567890@g.us
--
-- NO son válidos:
-- ❌ +34 654 32 10 98 (esto es un número de teléfono)
-- ❌ PENDING_MENORES (esto es el placeholder)
-- ❌ TU_ID_AQUI (esto es el placeholder)
-- ============================================================================

-- ============================================================================
-- ROLLBACK (Por si te equivocas y quieres volver a PENDING)
-- ============================================================================
/*
UPDATE whatsapp_groups
SET
  group_chat_id = 'PENDING_' ||
    CASE
      WHEN group_name LIKE '%Menores%' THEN 'MENORES'
      WHEN group_name LIKE '%Bronce%' THEN 'BRONCE'
      WHEN group_name LIKE '%Plata%' THEN 'PLATA'
      WHEN group_name LIKE '%Oro%' THEN 'ORO'
    END,
  updated_at = NOW()
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
*/
