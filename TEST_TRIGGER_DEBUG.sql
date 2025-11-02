-- TEST COMPLETO DEL TRIGGER - EJECUTAR PASO A PASO

-- ========================================
-- PASO 1: Verificar que la función auxiliar existe
-- ========================================
SELECT
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'create_student_enrollment_for_signup';

-- Deberías ver: function_name | owner | is_security_definer
--               create_student_enrollment_for_signup | postgres | true


-- ========================================
-- PASO 2: Test directo de la función auxiliar
-- ========================================
DO $$
DECLARE
  test_user_id uuid := 'ddef992d-caae-418d-a201-9e661c4648c0'; -- mark6
  test_email text := 'mark6@gmail.com';
  test_name text := 'Mark6';
  test_club_id uuid := '7b6f49ae-d496-407b-bca1-f5f1e9370610';
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING create_student_enrollment_for_signup FUNCTION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Email: %', test_email;
  RAISE NOTICE 'Club ID: %', test_club_id;

  -- Llamar a la función
  PERFORM public.create_student_enrollment_for_signup(
    test_user_id,
    test_email,
    test_name,
    test_club_id
  );

  RAISE NOTICE 'Function call completed';

  -- Verificar si se insertó
  IF EXISTS (
    SELECT 1 FROM student_enrollments
    WHERE email = test_email AND club_id = test_club_id
  ) THEN
    RAISE NOTICE '✅ SUCCESS: student_enrollment was created!';
  ELSE
    RAISE NOTICE '❌ FAILED: student_enrollment was NOT created';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ EXCEPTION: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;


-- ========================================
-- PASO 3: Verificar el resultado
-- ========================================
SELECT
  id,
  email,
  full_name,
  club_id,
  student_profile_id,
  created_at
FROM student_enrollments
WHERE email = 'mark6@gmail.com';

-- Si NO hay resultados, la función está fallando


-- ========================================
-- PASO 4: Test manual del INSERT directo (sin función)
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING DIRECT INSERT (bypassing function)';
  RAISE NOTICE '========================================';

  -- Intentar INSERT directo
  BEGIN
    INSERT INTO public.student_enrollments (
      full_name,
      email,
      club_id,
      student_profile_id,
      created_by_profile_id
    )
    VALUES (
      'Mark6 Test',
      'mark6test@gmail.com',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'::uuid,
      'ddef992d-caae-418d-a201-9e661c4648c0'::uuid,
      'ddef992d-caae-418d-a201-9e661c4648c0'::uuid
    );
    RAISE NOTICE '✅ Direct INSERT succeeded';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Direct INSERT failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
END $$;


-- ========================================
-- PASO 5: Verificar las RLS policies activas
-- ========================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'student_enrollments'
  AND cmd = 'INSERT';


-- ========================================
-- PASO 6: Test del trigger completo
-- ========================================
DO $$
DECLARE
  test_metadata jsonb;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING FULL TRIGGER SIMULATION';
  RAISE NOTICE '========================================';

  -- Simular metadata del usuario
  test_metadata := jsonb_build_object(
    'full_name', 'TestUser',
    'club_id', '7b6f49ae-d496-407b-bca1-f5f1e9370610',
    'level', 1,
    'role', 'player'
  );

  RAISE NOTICE 'Metadata: %', test_metadata;
  RAISE NOTICE 'Extracted club_id: %', test_metadata->>'club_id';
  RAISE NOTICE 'Extracted role: %', COALESCE(test_metadata->>'role', 'player');

  -- Verificar que la extracción funciona
  IF (test_metadata->>'club_id') IS NOT NULL AND
     COALESCE(test_metadata->>'role', 'player') = 'player' THEN
    RAISE NOTICE '✅ Conditions for enrollment creation are MET';
  ELSE
    RAISE NOTICE '❌ Conditions for enrollment creation are NOT met';
  END IF;
END $$;
