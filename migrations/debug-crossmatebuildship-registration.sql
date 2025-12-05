-- Investigar registro del alumno crossmatebuildship@gmail.com
-- Este usuario se registró con login social de Google y metió su teléfono
-- pero no aparece en la pantalla de jugadores del admin

DO $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_email TEXT := 'crossmatebuildship@gmail.com';
  rec RECORD;
BEGIN
  RAISE NOTICE '=== INVESTIGACIÓN REGISTRO crossmatebuildship@gmail.com ===';
  RAISE NOTICE '';

  -- 1. Verificar si existe en auth.users
  RAISE NOTICE '1. Buscando en auth.users...';
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ NO se encontró usuario en auth.users con email: %', v_email;
    RETURN;
  ELSE
    RAISE NOTICE '✓ Usuario encontrado en auth.users - ID: %', v_user_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '2. Datos completos de auth.users:';
  RAISE NOTICE '---';

  -- Mostrar datos de auth.users
  FOR rec IN
    SELECT
      id,
      email,
      phone,
      email_confirmed_at IS NOT NULL as email_confirmed,
      phone_confirmed_at IS NOT NULL as phone_confirmed,
      created_at,
      last_sign_in_at,
      (SELECT string_agg(provider, ', ')
       FROM auth.identities
       WHERE user_id = v_user_id) as providers
    FROM auth.users
    WHERE id = v_user_id
  LOOP
    RAISE NOTICE 'ID: %', rec.id;
    RAISE NOTICE 'Email: %', rec.email;
    RAISE NOTICE 'Email confirmado: %', rec.email_confirmed;
    RAISE NOTICE 'Teléfono: %', COALESCE(rec.phone, 'NULL');
    RAISE NOTICE 'Teléfono confirmado: %', rec.phone_confirmed;
    RAISE NOTICE 'Creado: %', rec.created_at;
    RAISE NOTICE 'Último login: %', rec.last_sign_in_at;
    RAISE NOTICE 'Provider: %', COALESCE(rec.providers, 'NULL');
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '3. Buscando en tabla profiles...';

  SELECT id INTO v_profile_id
  FROM profiles
  WHERE id = v_user_id;

  IF v_profile_id IS NULL THEN
    RAISE NOTICE '❌ NO existe perfil en tabla profiles para este usuario';
  ELSE
    RAISE NOTICE '✓ Perfil encontrado en tabla profiles';

    -- Mostrar datos del perfil
    RAISE NOTICE '';
    RAISE NOTICE 'Datos del perfil:';
    RAISE NOTICE '---';
    FOR rec IN
      SELECT
        id,
        email,
        full_name,
        phone,
        role,
        created_at,
        updated_at
      FROM profiles
      WHERE id = v_user_id
    LOOP
      RAISE NOTICE 'ID: %', rec.id;
      RAISE NOTICE 'Email: %', COALESCE(rec.email, 'NULL');
      RAISE NOTICE 'Nombre completo: %', COALESCE(rec.full_name, 'NULL');
      RAISE NOTICE 'Teléfono: %', COALESCE(rec.phone, 'NULL');
      RAISE NOTICE 'Role: %', COALESCE(rec.role, 'NULL');
      RAISE NOTICE 'Creado: %', rec.created_at;
      RAISE NOTICE 'Actualizado: %', rec.updated_at;
    END LOOP;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '4. Verificando student_enrollments...';

  -- Buscar por email ya que student_enrollments no tiene profile_id
  IF EXISTS (SELECT 1 FROM student_enrollments WHERE email = v_email) THEN
    RAISE NOTICE '✓ Tiene registro en student_enrollments:';
    RAISE NOTICE '---';

    FOR rec IN
      SELECT
        id,
        full_name,
        email,
        phone,
        level,
        club_id,
        created_at,
        updated_at
      FROM student_enrollments
      WHERE email = v_email
      ORDER BY created_at DESC
    LOOP
      RAISE NOTICE 'Enrollment ID: %', rec.id;
      RAISE NOTICE 'Nombre: %', COALESCE(rec.full_name, 'NULL');
      RAISE NOTICE 'Email: %', COALESCE(rec.email, 'NULL');
      RAISE NOTICE 'Teléfono: %', COALESCE(rec.phone, 'NULL');
      RAISE NOTICE 'Nivel: %', COALESCE(rec.level::text, 'NULL');
      RAISE NOTICE 'Club ID: %', COALESCE(rec.club_id::text, 'NULL');
      RAISE NOTICE 'Creado: %', rec.created_at;
      RAISE NOTICE '---';
    END LOOP;
  ELSE
    RAISE NOTICE '❌ NO tiene registro en student_enrollments';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '5. Verificando inscripciones en clases (class_participants)...';

  IF EXISTS (
    SELECT 1
    FROM class_participants cp
    JOIN student_enrollments se ON se.id = cp.student_enrollment_id
    WHERE se.email = v_email
  ) THEN
    RAISE NOTICE '✓ Tiene inscripciones en clases:';
    RAISE NOTICE '---';

    FOR rec IN
      SELECT
        cp.id,
        cp.class_id,
        pc.name as class_name,
        cp.status,
        cp.created_at,
        cp.updated_at
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE se.email = v_email
      ORDER BY cp.created_at DESC
    LOOP
      RAISE NOTICE 'Clase: % (ID: %)', rec.class_name, rec.class_id;
      RAISE NOTICE 'Estado: %', rec.status;
      RAISE NOTICE 'Inscrito: %', rec.created_at;
      RAISE NOTICE '---';
    END LOOP;
  ELSE
    RAISE NOTICE '⚠ NO tiene inscripciones en clases';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '6. Verificando en lista de espera...';

  -- Nota: Saltamos esta verificación por ahora ya que la estructura de waitlists puede variar
  RAISE NOTICE '⚠ Verificación de waitlists omitida (estructura de tabla variable)';

  RAISE NOTICE '';
  RAISE NOTICE '7. Verificando pagos...';

  -- Nota: Saltamos esta verificación por ahora ya que la tabla payments puede no existir
  RAISE NOTICE '⚠ Verificación de pagos omitida (tabla no disponible)';

  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMEN PARA PANTALLA DE ADMIN ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Verificando qué devuelve la query de jugadores del admin...';

  -- Simular la query que usa la pantalla de admin para mostrar jugadores
  -- Típicamente sería algo como SELECT * FROM profiles WHERE role = 'student'
  -- O una vista/función específica

  -- Verificar si aparece en la pantalla de jugadores (student_enrollments)
  IF EXISTS (
    SELECT 1
    FROM student_enrollments
    WHERE email = v_email
  ) THEN
    RAISE NOTICE '✓ El usuario aparece en student_enrollments (debería verse en pantalla de jugadores)';
  ELSE
    RAISE NOTICE '❌ El usuario NO existe en student_enrollments (NO aparecerá en pantalla de jugadores)';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNÓSTICO: El usuario se registró con Google pero NO se creó su registro en student_enrollments.';
    RAISE NOTICE '   Esto puede pasar si:';
    RAISE NOTICE '   1. No completó el proceso de onboarding/registro como jugador';
    RAISE NOTICE '   2. El formulario de registro de jugador no se ejecutó';
    RAISE NOTICE '   3. Hubo un error al crear el student_enrollment';
  END IF;

  -- Verificar role en profiles
  IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = v_user_id
    AND role = 'player'
  ) THEN
    RAISE NOTICE '✓ El usuario tiene role = ''player'' en profiles';
  ELSIF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = v_user_id
  ) THEN
    RAISE NOTICE '⚠ El usuario existe en profiles pero su role es: %',
      (SELECT role FROM profiles WHERE id = v_user_id);
    RAISE NOTICE '   Debería ser ''player'' para aparecer como jugador';
  ELSE
    RAISE NOTICE '❌ El usuario NO existe en la tabla profiles';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== FIN INVESTIGACIÓN ===';

END $$;

-- Consultas adicionales para verificar estructura

-- Ver todos los campos de auth.users para este usuario
SELECT
  id,
  email,
  phone,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE email = 'crossmatebuildship@gmail.com';

-- Ver todos los campos de profiles para este usuario
SELECT *
FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'crossmatebuildship@gmail.com'
);

-- Ver identidades (providers sociales)
SELECT
  i.provider,
  i.identity_data,
  i.created_at,
  i.updated_at
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email = 'crossmatebuildship@gmail.com';
