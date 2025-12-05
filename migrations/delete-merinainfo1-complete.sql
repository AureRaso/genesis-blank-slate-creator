-- Script para eliminar completamente el usuario merinainfo1@gmail.com
-- Ejecutar este script en Supabase SQL Editor

-- Paso 1: Buscar el usuario y obtener su ID
SELECT
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE email = 'merinainfo1@gmail.com';

-- Paso 2: Obtener el user ID (reemplazar 'USER_ID_HERE' con el ID real del paso 1)
DO $$
DECLARE
  user_id_to_delete uuid;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO user_id_to_delete
  FROM auth.users
  WHERE email = 'merinainfo1@gmail.com';

  IF user_id_to_delete IS NULL THEN
    RAISE NOTICE 'Usuario no encontrado con email: merinainfo1@gmail.com';
    RETURN;
  END IF;

  RAISE NOTICE 'Eliminando usuario con ID: %', user_id_to_delete;

  -- Paso 3: Eliminar de class_waitlist
  DELETE FROM class_waitlist
  WHERE student_enrollment_id IN (
    SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
  );
  RAISE NOTICE 'Eliminado de class_waitlist';

  -- Paso 4: Eliminar de class_participants
  DELETE FROM class_participants
  WHERE student_enrollment_id IN (
    SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
  );
  RAISE NOTICE 'Eliminado de class_participants';

  -- Paso 5: Eliminar de monthly_payments
  DELETE FROM monthly_payments
  WHERE student_enrollment_id IN (
    SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
  );
  RAISE NOTICE 'Eliminado de monthly_payments';

  -- Paso 6: Eliminar de student_enrollments
  DELETE FROM student_enrollments
  WHERE email = 'merinainfo1@gmail.com';
  RAISE NOTICE 'Eliminado de student_enrollments';

  -- Paso 7: Eliminar de lopivi_consents (si existe)
  DELETE FROM lopivi_consents
  WHERE user_id = user_id_to_delete;
  RAISE NOTICE 'Eliminado de lopivi_consents';

  -- Paso 8: Eliminar de account_dependents (si es guardian o dependiente)
  DELETE FROM account_dependents
  WHERE guardian_profile_id = user_id_to_delete
     OR dependent_profile_id = user_id_to_delete;
  RAISE NOTICE 'Eliminado de account_dependents';

  -- Paso 9: Eliminar de trainer_clubs (si es trainer)
  DELETE FROM trainer_clubs
  WHERE trainer_profile_id = user_id_to_delete;
  RAISE NOTICE 'Eliminado de trainer_clubs';

  -- Paso 10: Eliminar de profiles
  DELETE FROM profiles
  WHERE id = user_id_to_delete;
  RAISE NOTICE 'Eliminado de profiles';

  -- Paso 11: Eliminar de auth.users
  DELETE FROM auth.users
  WHERE id = user_id_to_delete;
  RAISE NOTICE 'Eliminado de auth.users';

  RAISE NOTICE '✅ Usuario merinainfo1@gmail.com eliminado completamente';
END $$;

-- Paso 12: Verificar que el usuario fue eliminado
SELECT
  id,
  email
FROM auth.users
WHERE email = 'merinainfo1@gmail.com';

-- Si no devuelve ningún resultado, la eliminación fue exitosa
