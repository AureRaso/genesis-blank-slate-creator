-- ============================================================================
-- MIGRATION: Add class_name and enrollment_type to student_bono_usages
-- ============================================================================
-- PURPOSE: Store class name and enrollment type (fixed/substitute) in usage
--          history for better audit trail.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns to student_bono_usages
-- ============================================================================
ALTER TABLE student_bono_usages
  ADD COLUMN IF NOT EXISTS class_name TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20);

COMMENT ON COLUMN student_bono_usages.class_name IS 'Nombre de la clase al momento del uso';
COMMENT ON COLUMN student_bono_usages.enrollment_type IS 'Tipo de inscripción: fixed o substitute';

-- ============================================================================
-- STEP 2: Drop existing function and recreate with new params
-- ============================================================================
DROP FUNCTION IF EXISTS deduct_bono_class(UUID, UUID, UUID, DATE, BOOLEAN);

CREATE FUNCTION deduct_bono_class(
  p_student_enrollment_id UUID,
  p_class_participant_id UUID DEFAULT NULL,
  p_class_id UUID DEFAULT NULL,
  p_class_date DATE DEFAULT NULL,
  p_is_waitlist BOOLEAN DEFAULT false,
  p_class_name TEXT DEFAULT NULL,
  p_enrollment_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bono student_bonos%ROWTYPE;
  v_usage_id UUID;
  v_bono_name TEXT;
  v_required_type TEXT;
BEGIN
  -- Determine which usage types are valid for this deduction
  IF p_is_waitlist THEN
    v_required_type := 'waitlist';
  ELSE
    v_required_type := 'fixed';
  END IF;

  -- Find the best active bono for this student that matches the usage type
  -- FIFO: nearest expiry first, then oldest purchase first
  SELECT * INTO v_bono
  FROM student_bonos
  WHERE student_enrollment_id = p_student_enrollment_id
    AND status = 'activo'
    AND remaining_classes > 0
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (usage_type = 'both' OR usage_type = v_required_type)
  ORDER BY
    expires_at ASC NULLS LAST,
    purchased_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_bono');
  END IF;

  -- Get the bono template name
  SELECT name INTO v_bono_name FROM bono_templates WHERE id = v_bono.bono_template_id;

  -- Decrement remaining classes
  UPDATE student_bonos
  SET remaining_classes = remaining_classes - 1,
      status = CASE WHEN remaining_classes - 1 = 0 THEN 'agotado' ELSE 'activo' END,
      updated_at = NOW()
  WHERE id = v_bono.id;

  -- Record usage with class info
  INSERT INTO student_bono_usages (
    student_bono_id, student_enrollment_id,
    class_participant_id, class_id, class_date,
    class_name, enrollment_type
  ) VALUES (
    v_bono.id, p_student_enrollment_id,
    p_class_participant_id, p_class_id, p_class_date,
    p_class_name, p_enrollment_type
  )
  RETURNING id INTO v_usage_id;

  RETURN jsonb_build_object(
    'success', true,
    'bono_id', v_bono.id,
    'usage_id', v_usage_id,
    'remaining', v_bono.remaining_classes - 1,
    'bono_name', v_bono_name
  );
END;
$$;

COMMENT ON FUNCTION deduct_bono_class IS 'Descuenta 1 clase del bono activo mas antiguo del alumno. Registra nombre de clase y tipo de inscripcion en el historial.';

-- ============================================================================
-- STEP 3: Notify PostgREST to reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
