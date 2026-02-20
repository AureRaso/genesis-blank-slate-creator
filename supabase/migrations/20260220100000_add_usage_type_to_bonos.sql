-- ============================================================================
-- MIGRATION: Add usage_type to bono_templates + update deduct_bono_class
-- ============================================================================
-- PURPOSE: Allow trainers to configure if a bono applies to fixed spots,
--          waitlist spots, or both.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add usage_type column to bono_templates
-- ============================================================================
ALTER TABLE bono_templates
  ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) NOT NULL DEFAULT 'both'
  CHECK (usage_type IN ('fixed', 'waitlist', 'both'));

COMMENT ON COLUMN bono_templates.usage_type IS 'Tipo de uso: fixed = solo plazas fijas, waitlist = solo lista de espera, both = ambos';

-- ============================================================================
-- STEP 2: Add usage_type to student_bonos (snapshot from template at purchase)
-- ============================================================================
ALTER TABLE student_bonos
  ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) NOT NULL DEFAULT 'both'
  CHECK (usage_type IN ('fixed', 'waitlist', 'both'));

COMMENT ON COLUMN student_bonos.usage_type IS 'Snapshot del tipo de uso del template al momento de asignar';

-- ============================================================================
-- STEP 3: Replace deduct_bono_class function with usage_type filter
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_bono_class(
  p_student_enrollment_id UUID,
  p_class_participant_id UUID DEFAULT NULL,
  p_class_id UUID DEFAULT NULL,
  p_class_date DATE DEFAULT NULL,
  p_is_waitlist BOOLEAN DEFAULT false
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

  -- Record usage
  INSERT INTO student_bono_usages (
    student_bono_id, student_enrollment_id,
    class_participant_id, class_id, class_date
  ) VALUES (
    v_bono.id, p_student_enrollment_id,
    p_class_participant_id, p_class_id, p_class_date
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

COMMENT ON FUNCTION deduct_bono_class IS 'Descuenta 1 clase del bono activo mas antiguo del alumno que coincida con el tipo de uso (fixed/waitlist/both). Usa FOR UPDATE para evitar race conditions.';
