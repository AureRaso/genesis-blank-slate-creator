-- SOLUCIÓN TEMPORAL: Añadir manualmente un hijo para Antonio Nocete
-- Guardian ID: a1dce7a0-2b7d-4651-89f7-4157cdeb152e
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610

-- IMPORTANTE: Este es un workaround temporal para que el usuario pueda usar la app
-- Después hay que investigar por qué falla la creación automática

-- PASO 1: Buscar si hay algún hijo "huérfano" ya creado para este guardian
SELECT
  u.id as user_id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  p.club_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%@temp.padelock.com%'
  AND u.created_at > '2025-10-22 10:50:00'  -- Después de que se creó el guardian
  AND p.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Mismo club
  AND NOT EXISTS (
    SELECT 1 FROM account_dependents ad
    WHERE ad.dependent_profile_id = u.id
  )
ORDER BY u.created_at DESC;

-- PASO 2: Si hay hijos huérfanos, crear la relación manualmente
-- REEMPLAZA <CHILD_ID> con el ID del hijo encontrado en el paso 1
/*
INSERT INTO account_dependents (
  guardian_profile_id,
  dependent_profile_id,
  relationship_type,
  birth_date
)
VALUES (
  'a1dce7a0-2b7d-4651-89f7-4157cdeb152e',  -- Antonio (guardian)
  '<CHILD_ID>',  -- ID del hijo huérfano
  'child',
  NULL
);
*/

-- PASO 3: Verificar que la relación se creó correctamente
SELECT
  ad.id,
  ad.guardian_profile_id,
  ad.dependent_profile_id,
  p.full_name as child_name,
  p.email as child_email,
  ad.created_at
FROM account_dependents ad
LEFT JOIN profiles p ON p.id = ad.dependent_profile_id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- PASO 4 (ALTERNATIVO): Si NO hay hijos huérfanos, crear uno completamente desde cero
-- NOTA: Esto requiere acceso admin y es más complejo. Mejor esperar a ver los logs.
