-- ========================================
-- MÉTODO SIMPLE: Crear hijo para Antonio
-- ========================================
-- Este método usa SOLO SQL y no requiere crear usuario en auth.users
-- El hijo será un "perfil fantasma" que solo existe en la tabla profiles
-- ========================================

-- PASO 1: Generar un UUID único para el hijo
-- Ejecuta esto primero para obtener el ID
SELECT gen_random_uuid() as new_child_id;

-- PASO 2: Crear el perfil del hijo directamente
-- Reemplaza <NEW_CHILD_ID> con el UUID generado arriba
-- Reemplaza 'Nombre del Hijo' con el nombre real

INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  club_id,
  level,
  created_at,
  updated_at
)
VALUES (
  '<NEW_CHILD_ID>',  -- UUID generado en el paso 1
  'Hijo de Antonio Test',  -- Nombre del hijo (CÁMBIALO)
  'child.antonio.test.' || extract(epoch from now())::bigint || '@temp.padelock.com',
  'player',
  '7b6f49ae-d496-407b-bca1-f5f1e9370610',  -- Club Hespérides
  3.0,  -- Nivel inicial
  now(),
  now()
);

-- PASO 3: Crear la relación con Antonio
-- Usa el mismo <NEW_CHILD_ID> del paso 2

INSERT INTO account_dependents (
  guardian_profile_id,
  dependent_profile_id,
  relationship_type,
  birth_date
)
VALUES (
  'a1dce7a0-2b7d-4651-89f7-4157cdeb152e',  -- Antonio
  '<NEW_CHILD_ID>',  -- Mismo ID del paso 2
  'child',
  '2015-01-01'::date  -- Fecha de nacimiento ficticia (10 años)
);

-- PASO 4: Verificar que se creó correctamente
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.level,
  p.club_id,
  ad.relationship_type,
  ad.birth_date
FROM profiles p
LEFT JOIN account_dependents ad ON ad.dependent_profile_id = p.id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';
