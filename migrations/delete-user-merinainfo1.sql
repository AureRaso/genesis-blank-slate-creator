-- Script para eliminar completamente el usuario: merinainfo1@gmail.com
-- IMPORTANTE: Este script eliminará TODOS los datos asociados al usuario de forma permanente
-- Ejecutar en orden

-- ==================================================
-- PASO 1: Buscar el user_id del usuario
-- ==================================================
DO $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_email TEXT := 'merinainfo1@gmail.com';
BEGIN
  -- Buscar en auth.users (tabla de autenticación de Supabase)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No se encontró usuario con email: %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Usuario encontrado - ID: %', v_user_id;

  -- Buscar el profile_id
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE id = v_user_id;

  IF v_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Profile encontrado - ID: %', v_profile_id;
  END IF;

  -- ==================================================
  -- PASO 2: Registrar la eliminación
  -- ==================================================
  INSERT INTO account_deletion_logs (user_id, email, reason)
  VALUES (v_user_id, v_email, 'Manual deletion by admin');

  RAISE NOTICE 'Registro de eliminación creado';

  -- ==================================================
  -- PASO 3: Eliminar datos relacionados con el perfil
  -- ==================================================

  -- Eliminar consentimientos LOPIVI
  DELETE FROM lopivi_consents WHERE user_id = v_profile_id;
  RAISE NOTICE 'Consentimientos LOPIVI eliminados';

  -- Eliminar reportes LOPIVI creados por el usuario
  DELETE FROM lopivi_reports WHERE reporter_profile_id = v_profile_id;
  RAISE NOTICE 'Reportes LOPIVI eliminados';

  -- Eliminar reportes LOPIVI resueltos por el usuario
  UPDATE lopivi_reports SET resolved_by_profile_id = NULL WHERE resolved_by_profile_id = v_profile_id;
  RAISE NOTICE 'Referencias en reportes LOPIVI limpiadas';

  -- ==================================================
  -- PASO 4: Eliminar datos de estudiante
  -- ==================================================

  -- Eliminar inscripciones a clases (student_classes)
  DELETE FROM student_classes WHERE student_id = v_profile_id;
  RAISE NOTICE 'Inscripciones a clases eliminadas';

  -- Eliminar asistencias
  DELETE FROM attendance WHERE student_id = v_profile_id;
  RAISE NOTICE 'Registros de asistencia eliminados';

  -- Eliminar de listas de espera
  DELETE FROM waitlist WHERE student_id = v_profile_id;
  RAISE NOTICE 'Registros de lista de espera eliminados';

  -- Eliminar scores de asistencia
  DELETE FROM student_attendance_scores WHERE student_enrollment_id IN (
    SELECT id FROM student_classes WHERE student_id = v_profile_id
  );
  RAISE NOTICE 'Scores de asistencia eliminados';

  -- Eliminar historial de scores
  DELETE FROM student_attendance_score_history WHERE student_enrollment_id IN (
    SELECT id FROM student_classes WHERE student_id = v_profile_id
  );
  RAISE NOTICE 'Historial de scores eliminados';

  -- ==================================================
  -- PASO 5: Eliminar datos de clubs creados por el usuario
  -- ==================================================

  -- Nota: Esto eliminará todos los clubs creados por el usuario y todos sus datos relacionados
  -- debido a las cascadas ON DELETE CASCADE
  DELETE FROM clubs WHERE created_by_profile_id = v_profile_id;
  RAISE NOTICE 'Clubs creados por el usuario eliminados (con cascada)';

  -- ==================================================
  -- PASO 6: Eliminar pagos mensuales
  -- ==================================================
  DELETE FROM monthly_payments WHERE student_id = v_profile_id;
  RAISE NOTICE 'Pagos mensuales eliminados';

  -- ==================================================
  -- PASO 7: Eliminar el perfil
  -- ==================================================
  DELETE FROM profiles WHERE id = v_profile_id;
  RAISE NOTICE 'Perfil eliminado';

  -- ==================================================
  -- PASO 8: Eliminar el usuario de auth.users
  -- ==================================================
  -- IMPORTANTE: Este paso requiere permisos de superadmin
  -- Si no tienes permisos, deberás hacerlo desde el dashboard de Supabase
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE 'Usuario de autenticación eliminado';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usuario % eliminado completamente', v_email;
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE;
END $$;
