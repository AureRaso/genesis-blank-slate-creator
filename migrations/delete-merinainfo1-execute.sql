-- Script EJECUTABLE para eliminar merinainfo1@gmail.com
-- Solo ejecutar la parte de eliminación (sin consultas previas)

DO $$
DECLARE
  user_id_to_delete uuid := '13fa9263-5ebb-4e94-846c-173b77018348';
BEGIN
  RAISE NOTICE 'Eliminando usuario con ID: %', user_id_to_delete;

  -- Paso 1: Eliminar de class_waitlist
  DELETE FROM class_waitlist
  WHERE student_enrollment_id IN (
    SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
  );
  RAISE NOTICE '✓ Eliminado de class_waitlist';

  -- Paso 2: Eliminar de class_participants
  DELETE FROM class_participants
  WHERE student_enrollment_id IN (
    SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
  );
  RAISE NOTICE '✓ Eliminado de class_participants';

  -- Paso 3: Eliminar de monthly_payments
  DELETE FROM monthly_payments
  WHERE student_enrollment_id IN (
    SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
  );
  RAISE NOTICE '✓ Eliminado de monthly_payments';

  -- Paso 4: Eliminar de student_enrollments
  DELETE FROM student_enrollments
  WHERE email = 'merinainfo1@gmail.com';
  RAISE NOTICE '✓ Eliminado de student_enrollments';

  -- Paso 5: Eliminar de lopivi_consents
  DELETE FROM lopivi_consents
  WHERE user_id = user_id_to_delete;
  RAISE NOTICE '✓ Eliminado de lopivi_consents';

  -- Paso 6: Eliminar de account_dependents
  DELETE FROM account_dependents
  WHERE guardian_profile_id = user_id_to_delete
     OR dependent_profile_id = user_id_to_delete;
  RAISE NOTICE '✓ Eliminado de account_dependents';

  -- Paso 7: Eliminar de trainer_clubs
  DELETE FROM trainer_clubs
  WHERE trainer_profile_id = user_id_to_delete;
  RAISE NOTICE '✓ Eliminado de trainer_clubs';

  -- Paso 8: Eliminar de profiles
  DELETE FROM profiles
  WHERE id = user_id_to_delete;
  RAISE NOTICE '✓ Eliminado de profiles';

  -- Paso 9: Eliminar de auth.users (ÚLTIMO PASO)
  DELETE FROM auth.users
  WHERE id = user_id_to_delete;
  RAISE NOTICE '✓ Eliminado de auth.users';

  RAISE NOTICE '🎉 ✅ Usuario merinainfo1@gmail.com eliminado completamente';
END $$;

-- Verificación final
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ELIMINACIÓN EXITOSA - Usuario no encontrado'
    ELSE '⚠️ ERROR - Usuario todavía existe'
  END as resultado
FROM auth.users
WHERE email = 'merinainfo1@gmail.com';
