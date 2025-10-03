-- Eliminar la función anterior que intentaba crear usuarios directamente
DROP FUNCTION IF EXISTS complete_enrollment_form(UUID, JSONB);

-- Crear nueva función que solo maneja el enrollment, no la creación de usuarios
-- La creación de usuarios se hará desde un Edge Function
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
  v_result JSONB;
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

  -- Verificar que la contraseña existe
  IF p_student_data->>'password' IS NULL OR length(p_student_data->>'password') < 6 THEN
    RAISE EXCEPTION 'Password is required and must be at least 6 characters';
  END IF;

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

  -- Retornar los datos del enrollment creado junto con la contraseña
  -- La contraseña se devuelve para que el frontend pueda crear el usuario
  SELECT jsonb_build_object(
    'id', id,
    'full_name', full_name,
    'email', email,
    'phone', phone,
    'level', level,
    'status', status,
    'club_id', club_id,
    'created_at', created_at,
    'password', p_student_data->>'password'
  ) INTO v_result
  FROM student_enrollments
  WHERE id = v_enrollment_id;

  RETURN v_result;
END;
$function$;

-- Mantener permisos
GRANT EXECUTE ON FUNCTION complete_enrollment_form(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION complete_enrollment_form(UUID, JSONB) TO authenticated;
