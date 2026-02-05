-- ============================================================================
-- MIGRATION: Add optional club_id filter to auto_generate_monthly_payments
-- ============================================================================
-- PURPOSE: Allow filtering by club_id for testing purposes
-- ============================================================================

-- Drop the existing function first to avoid signature conflicts
DROP FUNCTION IF EXISTS auto_generate_monthly_payments(INTEGER, INTEGER, INTEGER, VARCHAR);

-- ============================================================================
-- FUNCTION: Auto-generate monthly payments (with optional club filter)
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_generate_monthly_payments(
  p_billing_day INTEGER,
  p_target_month INTEGER DEFAULT NULL,
  p_target_year INTEGER DEFAULT NULL,
  p_triggered_by VARCHAR DEFAULT 'cron',
  p_club_id UUID DEFAULT NULL  -- NEW: Optional club filter for testing
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_target_month INTEGER;
  v_target_year INTEGER;
  v_period_start DATE;
  v_period_end DATE;
  v_log_id UUID;
  v_result JSONB;
  v_details JSONB := '[]'::jsonb;
  v_errors JSONB := '[]'::jsonb;
  v_total_processed INTEGER := 0;
  v_generated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors_count INTEGER := 0;
  v_assignment RECORD;
  v_payment_id UUID;
  v_classes_count INTEGER;
  v_existing_payment_id UUID;
BEGIN
  v_start_time := NOW();

  -- Determine target month/year (current month if not specified)
  v_target_month := COALESCE(p_target_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
  v_target_year := COALESCE(p_target_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  -- Calculate period dates for the target month
  v_period_start := make_date(v_target_year, v_target_month, 1);
  v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Create log entry
  INSERT INTO payment_generation_logs (
    billing_day, target_month, target_year, triggered_by
  ) VALUES (
    p_billing_day, v_target_month, v_target_year, p_triggered_by
  ) RETURNING id INTO v_log_id;

  -- Process all active assignments with this billing day
  -- Optionally filtered by club_id if provided
  FOR v_assignment IN
    SELECT
      sra.id AS assignment_id,
      sra.student_enrollment_id,
      sra.payment_rate_id,
      sra.start_date AS assignment_start_date,
      sra.end_date AS assignment_end_date,
      pr.id AS rate_id,
      pr.club_id,
      pr.name AS rate_name,
      pr.rate_type,
      pr.fixed_price,
      pr.price_per_class,
      pr.due_days,
      se.full_name AS student_name,
      se.email AS student_email
    FROM student_rate_assignments sra
    JOIN payment_rates pr ON pr.id = sra.payment_rate_id
    JOIN student_enrollments se ON se.id = sra.student_enrollment_id
    WHERE sra.status = 'activa'
      AND pr.is_active = true
      AND pr.billing_day = p_billing_day
      -- Optional club filter
      AND (p_club_id IS NULL OR pr.club_id = p_club_id)
      -- Assignment must be active during this period
      AND sra.start_date <= v_period_end
      AND (sra.end_date IS NULL OR sra.end_date >= v_period_start)
  LOOP
    v_total_processed := v_total_processed + 1;

    BEGIN
      -- Check if payment already exists for this period
      SELECT id INTO v_existing_payment_id
      FROM student_payments
      WHERE rate_assignment_id = v_assignment.assignment_id
        AND period_start = v_period_start
        AND period_end = v_period_end
      LIMIT 1;

      IF v_existing_payment_id IS NOT NULL THEN
        -- Payment already exists, skip
        v_skipped := v_skipped + 1;
        v_details := v_details || jsonb_build_object(
          'assignment_id', v_assignment.assignment_id,
          'student_name', v_assignment.student_name,
          'status', 'skipped',
          'reason', 'payment_exists',
          'existing_payment_id', v_existing_payment_id
        );
        CONTINUE;
      END IF;

      -- Handle per-class rates
      IF v_assignment.rate_type = 'por_clase' THEN
        -- Count classes for this student in the target month
        v_classes_count := count_student_classes_in_month(
          v_assignment.student_enrollment_id,
          v_period_start,
          v_period_end
        );

        -- Skip if no classes
        IF v_classes_count = 0 THEN
          v_skipped := v_skipped + 1;
          v_details := v_details || jsonb_build_object(
            'assignment_id', v_assignment.assignment_id,
            'student_name', v_assignment.student_name,
            'status', 'skipped',
            'reason', 'no_classes_in_period'
          );
          CONTINUE;
        END IF;

        -- Generate payment with class count
        v_payment_id := generate_payment_for_assignment(
          v_assignment.assignment_id,
          v_period_start,
          v_period_end,
          v_classes_count
        );
      ELSE
        -- Fixed rate: generate payment directly
        v_payment_id := generate_payment_for_assignment(
          v_assignment.assignment_id,
          v_period_start,
          v_period_end,
          NULL
        );
        v_classes_count := NULL;
      END IF;

      -- Payment generated successfully
      v_generated := v_generated + 1;
      v_details := v_details || jsonb_build_object(
        'assignment_id', v_assignment.assignment_id,
        'student_name', v_assignment.student_name,
        'payment_id', v_payment_id,
        'status', 'generated',
        'rate_type', v_assignment.rate_type,
        'classes_count', v_classes_count
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other assignments
      v_errors_count := v_errors_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'assignment_id', v_assignment.assignment_id,
        'student_name', v_assignment.student_name,
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Update log entry with results
  UPDATE payment_generation_logs
  SET
    total_assignments_processed = v_total_processed,
    payments_generated = v_generated,
    payments_skipped = v_skipped,
    errors_count = v_errors_count,
    details = v_details,
    errors = v_errors,
    execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;

  -- Return summary
  v_result := jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'billing_day', p_billing_day,
    'target_period', TO_CHAR(v_period_start, 'YYYY-MM'),
    'total_processed', v_total_processed,
    'generated', v_generated,
    'skipped', v_skipped,
    'errors', v_errors_count,
    'execution_time_ms', EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000,
    'club_id', p_club_id  -- Include club_id in result for reference
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION auto_generate_monthly_payments IS 'Automatically generates payments for all active assignments with the specified billing day. Generates payments for the CURRENT month (pre-pay model). Optional p_club_id parameter filters to a specific club for testing.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auto_generate_monthly_payments TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_monthly_payments TO service_role;
