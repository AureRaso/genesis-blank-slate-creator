-- ============================================================================
-- FIX MIGRATION: Fix usage_type columns + drop old deduct_bono_class overload
-- ============================================================================
-- ISSUE 1: The old deduct_bono_class(UUID, UUID, UUID, DATE) still exists.
--          CREATE OR REPLACE with 5 params created a NEW overload instead of
--          replacing the old one. We must DROP the old signature first.
-- ISSUE 2: The usage_type column on student_bonos may not have been added
--          if the previous migration failed partway through.
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure usage_type column exists on bono_templates
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bono_templates' AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE bono_templates
      ADD COLUMN usage_type VARCHAR(20) NOT NULL DEFAULT 'both';
    ALTER TABLE bono_templates
      ADD CONSTRAINT bono_templates_usage_type_check
      CHECK (usage_type IN ('fixed', 'waitlist', 'both'));
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure usage_type column exists on student_bonos
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_bonos' AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE student_bonos
      ADD COLUMN usage_type VARCHAR(20) NOT NULL DEFAULT 'both';
    ALTER TABLE student_bonos
      ADD CONSTRAINT student_bonos_usage_type_check
      CHECK (usage_type IN ('fixed', 'waitlist', 'both'));
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop ALL existing deduct_bono_class overloads
-- ============================================================================
-- Drop the old 4-param version
DROP FUNCTION IF EXISTS deduct_bono_class(UUID, UUID, UUID, DATE);
-- Drop the new 5-param version (if it was partially created)
DROP FUNCTION IF EXISTS deduct_bono_class(UUID, UUID, UUID, DATE, BOOLEAN);

-- ============================================================================
-- STEP 4: Recreate deduct_bono_class with usage_type filter (single version)
-- ============================================================================
CREATE FUNCTION deduct_bono_class(
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

-- ============================================================================
-- STEP 5: Notify PostgREST to reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
