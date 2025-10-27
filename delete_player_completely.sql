-- ============================================
-- SCRIPT PARA ELIMINAR COMPLETAMENTE UN JUGADOR
-- ============================================
-- ADVERTENCIA: Esta operación es IRREVERSIBLE
-- Se eliminará TODO el historial del jugador
-- ============================================

-- CONFIGURACIÓN: Reemplaza con el email del jugador
DO $$
DECLARE
  player_email TEXT := 'juan@gmail.com';  -- CAMBIA ESTO
  enrollment_id UUID;
  profile_id UUID;
  deleted_waitlist INT;
  deleted_participants INT;
  deleted_leagues INT;
  deleted_payments INT;
  deleted_enrollments INT;
  deleted_profiles INT;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'INICIANDO ELIMINACIÓN DEL JUGADOR: %', player_email;
  RAISE NOTICE '============================================';

  -- PASO 1: Verificar que el jugador existe
  SELECT id INTO profile_id FROM profiles WHERE email = player_email;

  IF profile_id IS NULL THEN
    RAISE NOTICE '❌ ERROR: No se encontró ningún perfil con el email: %', player_email;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Perfil encontrado - ID: %', profile_id;

  -- PASO 2: Obtener enrollment_id
  SELECT id INTO enrollment_id FROM student_enrollments WHERE email = player_email;

  IF enrollment_id IS NULL THEN
    RAISE NOTICE '⚠️  ADVERTENCIA: No se encontró enrollment para este email';
  ELSE
    RAISE NOTICE '✓ Enrollment encontrado - ID: %', enrollment_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Iniciando eliminación en cascada...';
  RAISE NOTICE '';

  -- PASO 3.1: Eliminar de class_waitlist
  DELETE FROM class_waitlist
  WHERE student_enrollment_id = enrollment_id;
  GET DIAGNOSTICS deleted_waitlist = ROW_COUNT;
  RAISE NOTICE '1/6 Listas de espera eliminadas: %', deleted_waitlist;

  -- PASO 3.2: Eliminar de class_participants
  DELETE FROM class_participants
  WHERE student_enrollment_id = enrollment_id;
  GET DIAGNOSTICS deleted_participants = ROW_COUNT;
  RAISE NOTICE '2/6 Participaciones en clases eliminadas: %', deleted_participants;

  -- PASO 3.3: Eliminar de league_enrollments
  DELETE FROM league_enrollments
  WHERE student_enrollment_id = enrollment_id;
  GET DIAGNOSTICS deleted_leagues = ROW_COUNT;
  RAISE NOTICE '3/6 Inscripciones en ligas eliminadas: %', deleted_leagues;

  -- PASO 3.4: Eliminar de payment_records
  DELETE FROM payment_records
  WHERE student_enrollment_id = enrollment_id;
  GET DIAGNOSTICS deleted_payments = ROW_COUNT;
  RAISE NOTICE '4/6 Registros de pagos eliminados: %', deleted_payments;

  -- PASO 3.5: Eliminar de student_enrollments
  DELETE FROM student_enrollments
  WHERE email = player_email;
  GET DIAGNOSTICS deleted_enrollments = ROW_COUNT;
  RAISE NOTICE '5/6 Enrollments eliminados: %', deleted_enrollments;

  -- PASO 3.6: Eliminar de profiles
  DELETE FROM profiles
  WHERE email = player_email;
  GET DIAGNOSTICS deleted_profiles = ROW_COUNT;
  RAISE NOTICE '6/6 Perfiles eliminados: %', deleted_profiles;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ELIMINACIÓN COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESUMEN:';
  RAISE NOTICE '  - Listas de espera: % registros', deleted_waitlist;
  RAISE NOTICE '  - Participaciones: % registros', deleted_participants;
  RAISE NOTICE '  - Ligas: % registros', deleted_leagues;
  RAISE NOTICE '  - Pagos: % registros', deleted_payments;
  RAISE NOTICE '  - Enrollments: % registros', deleted_enrollments;
  RAISE NOTICE '  - Perfiles: % registros', deleted_profiles;
  RAISE NOTICE '============================================';

  -- Verificación final
  IF EXISTS (SELECT 1 FROM profiles WHERE email = player_email) THEN
    RAISE NOTICE '❌ ERROR: El perfil todavía existe';
  ELSE
    RAISE NOTICE '✓ Verificación: El jugador ha sido eliminado completamente';
  END IF;

END $$;

-- Verificación adicional
SELECT
  (SELECT COUNT(*) FROM profiles WHERE email = 'juan@gmail.com') as profiles_remaining,
  (SELECT COUNT(*) FROM student_enrollments WHERE email = 'juan@gmail.com') as enrollments_remaining,
  (SELECT COUNT(*) FROM class_participants cp
   JOIN student_enrollments se ON cp.student_enrollment_id = se.id
   WHERE se.email = 'juan@gmail.com') as participants_remaining;
