-- ========================================
-- MÉTODO MÁS SIMPLE: Un solo query que lo hace todo
-- ========================================
-- Solo copia y pega este bloque completo en el SQL Editor de Supabase
-- Cambia el nombre 'Hijo de Antonio' si quieres otro nombre
-- ========================================

DO $$
DECLARE
  new_child_id uuid;
BEGIN
  -- Generar UUID para el hijo
  new_child_id := gen_random_uuid();

  -- Crear el perfil del hijo
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
    new_child_id,
    'Hijo de Antonio',  -- CAMBIA ESTE NOMBRE SI QUIERES
    'child.antonio.' || extract(epoch from now())::bigint || '@temp.padelock.com',
    'player',
    '7b6f49ae-d496-407b-bca1-f5f1e9370610',  -- Club Hespérides
    3.0,  -- Nivel inicial
    now(),
    now()
  );

  -- Crear la relación con Antonio
  INSERT INTO account_dependents (
    guardian_profile_id,
    dependent_profile_id,
    relationship_type,
    birth_date
  )
  VALUES (
    'a1dce7a0-2b7d-4651-89f7-4157cdeb152e',  -- Antonio
    new_child_id,
    'child',
    '2015-01-01'::date  -- 10 años de edad
  );

  -- Mostrar resultado
  RAISE NOTICE 'Hijo creado exitosamente con ID: %', new_child_id;
END $$;

-- Verificar que se creó correctamente
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.level,
  ad.relationship_type,
  EXTRACT(YEAR FROM age(ad.birth_date)) as edad
FROM profiles p
INNER JOIN account_dependents ad ON ad.dependent_profile_id = p.id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';
