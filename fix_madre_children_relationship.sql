-- Script para vincular manualmente los hijos con madre@gmail.com
-- Esto es necesario porque el primer hijo se creó cuando había un bug de sesión

-- 1. Encontrar el ID de madre@gmail.com
DO $$
DECLARE
  madre_id UUID;
  child_maria_id UUID;
  child_hijo2_id UUID;
BEGIN
  -- Obtener ID de madre
  SELECT id INTO madre_id
  FROM profiles
  WHERE email = 'madre@gmail.com';

  IF madre_id IS NULL THEN
    RAISE NOTICE 'No se encontró el perfil de madre@gmail.com';
    RETURN;
  END IF;

  RAISE NOTICE 'Madre ID: %', madre_id;

  -- Obtener ID de Maria (primer hijo)
  SELECT id INTO child_maria_id
  FROM profiles
  WHERE email LIKE 'child.maria%@temp.padelock.com'
  AND role = 'player'
  ORDER BY created_at ASC
  LIMIT 1;

  IF child_maria_id IS NOT NULL THEN
    RAISE NOTICE 'Maria ID: %', child_maria_id;

    -- Insertar relación si no existe
    INSERT INTO account_dependents (guardian_profile_id, dependent_profile_id, relationship_type)
    VALUES (madre_id, child_maria_id, 'child')
    ON CONFLICT (guardian_profile_id, dependent_profile_id) DO NOTHING;

    RAISE NOTICE 'Relación creada para Maria';
  END IF;

  -- Obtener ID de Hijo2
  SELECT id INTO child_hijo2_id
  FROM profiles
  WHERE email LIKE 'child.hijo2%@temp.padelock.com'
  AND role = 'player'
  ORDER BY created_at ASC
  LIMIT 1;

  IF child_hijo2_id IS NOT NULL THEN
    RAISE NOTICE 'Hijo2 ID: %', child_hijo2_id;

    -- Insertar relación si no existe
    INSERT INTO account_dependents (guardian_profile_id, dependent_profile_id, relationship_type)
    VALUES (madre_id, child_hijo2_id, 'child')
    ON CONFLICT (guardian_profile_id, dependent_profile_id) DO NOTHING;

    RAISE NOTICE 'Relación creada para Hijo2';
  END IF;

END $$;

-- Verificar resultado
SELECT
  ad.id,
  p_guardian.email as guardian_email,
  p_guardian.full_name as guardian_name,
  p_child.email as child_email,
  p_child.full_name as child_name,
  ad.created_at
FROM account_dependents ad
JOIN profiles p_guardian ON ad.guardian_profile_id = p_guardian.id
JOIN profiles p_child ON ad.dependent_profile_id = p_child.id
WHERE p_guardian.email = 'madre@gmail.com'
ORDER BY ad.created_at DESC;
