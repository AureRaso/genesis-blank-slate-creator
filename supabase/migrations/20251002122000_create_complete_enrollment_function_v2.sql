-- Función RPC para completar un enrollment_form y crear el student_enrollment
-- Esta función se ejecuta con SECURITY DEFINER para bypasear RLS
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
    student_data = p_student_data,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE token = p_token;

  -- Retornar los datos del enrollment creado
  SELECT jsonb_build_object(
    'id', id,
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

-- Dar permisos de ejecución a usuarios anónimos
GRANT EXECUTE ON FUNCTION complete_enrollment_form(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION complete_enrollment_form(UUID, JSONB) TO authenticated;
