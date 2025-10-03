-- Actualizar la función complete_enrollment_form para crear usuario y perfil
CREATE OR REPLACE FUNCTION complete_enrollment_form(
  p_token UUID,
  p_student_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_form_data enrollment_forms%ROWTYPE;
  v_enrollment_id UUID;
  v_user_id UUID;
  v_result JSONB;
  v_password TEXT;
BEGIN
  -- Verificar que el token existe y está pending
  SELECT * INTO v_form_data
  FROM enrollment_forms
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired enrollment token';
  END IF;

  -- Extraer la contraseña del student_data
  v_password := p_student_data->>'password';

  IF v_password IS NULL OR length(v_password) < 6 THEN
    RAISE EXCEPTION 'Password is required and must be at least 6 characters';
  END IF;

  -- Crear el usuario en auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      (p_student_data->>'email')::TEXT,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('full_name', (p_student_data->>'full_name')::TEXT)::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;
  EXCEPTION
    WHEN unique_violation THEN
      -- Si el usuario ya existe, obtener su ID
      SELECT id INTO v_user_id
      FROM auth.users
      WHERE email = (p_student_data->>'email')::TEXT;

      IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User already exists but could not be retrieved';
      END IF;
  END;

  -- Crear o actualizar el perfil
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    (p_student_data->>'email')::TEXT,
    (p_student_data->>'full_name')::TEXT,
    'player',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- Crear el student_enrollment
  INSERT INTO student_enrollments (
    trainer_profile_id,
    club_id,
    created_by_profile_id,
    full_name,
    email,
    phone,
    level,
    weekly_days,
    preferred_times,
    enrollment_period,
    observations,
    status
  )
  VALUES (
    v_form_data.trainer_profile_id,
    v_form_data.club_id,
    v_form_data.trainer_profile_id,
    (p_student_data->>'full_name')::TEXT,
    (p_student_data->>'email')::TEXT,
    (p_student_data->>'phone')::TEXT,
    (p_student_data->>'level')::NUMERIC,
    COALESCE((p_student_data->'weekly_days')::JSONB, '[]'::JSONB)::TEXT[],
    COALESCE((p_student_data->'preferred_times')::JSONB, '[]'::JSONB)::TEXT[],
    COALESCE((p_student_data->>'enrollment_period')::TEXT, 'mensual'),
    (p_student_data->>'observations')::TEXT,
    'active'
  )
  RETURNING id INTO v_enrollment_id;

  -- Actualizar el enrollment_form como completado
  UPDATE enrollment_forms
  SET
    status = 'completed',
    student_data = p_student_data - 'password' - 'confirm_password', -- No guardar contraseñas
    completed_at = NOW(),
    updated_at = NOW()
  WHERE token = p_token;

  -- Retornar los datos del enrollment creado
  SELECT jsonb_build_object(
    'id', id,
    'user_id', v_user_id,
    'full_name', full_name,
    'email', email,
    'phone', phone,
    'level', level,
    'status', status,
    'club_id', club_id,
    'created_at', created_at
  ) INTO v_result
  FROM student_enrollments
  WHERE id = v_enrollment_id;

  RETURN v_result;
END;
$function$;

-- Mantener permisos
GRANT EXECUTE ON FUNCTION complete_enrollment_form(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION complete_enrollment_form(UUID, JSONB) TO authenticated;
