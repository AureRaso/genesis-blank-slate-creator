-- ============================================================================
-- MIGRATION: Automatic Monthly Payment Generation System
-- ============================================================================
-- PURPOSE: Enable automatic generation of payments on the billing_day of each
--          payment rate. Payments are generated for the CURRENT month (pre-pay).
-- ============================================================================

-- ============================================================================
-- TABLE: payment_generation_logs (Audit log for automatic generation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Execution context
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 28),
  target_month INTEGER NOT NULL CHECK (target_month >= 1 AND target_month <= 12),
  target_year INTEGER NOT NULL CHECK (target_year >= 2020),

  -- Results
  total_assignments_processed INTEGER NOT NULL DEFAULT 0,
  payments_generated INTEGER NOT NULL DEFAULT 0,
  payments_skipped INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,

  -- Detailed results (JSONB for flexibility)
  details JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,

  -- Execution metadata
  execution_time_ms INTEGER,
  triggered_by VARCHAR(50) DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'manual', 'test'))
);

-- Indexes
CREATE INDEX idx_payment_generation_logs_date ON payment_generation_logs(executed_at DESC);
CREATE INDEX idx_payment_generation_logs_billing_day ON payment_generation_logs(billing_day);
CREATE INDEX idx_payment_generation_logs_period ON payment_generation_logs(target_year, target_month);

-- Comments
COMMENT ON TABLE payment_generation_logs IS 'Audit log for automatic payment generation. Records each execution of the cron job.';
COMMENT ON COLUMN payment_generation_logs.billing_day IS 'The billing day that was processed (1-28)';
COMMENT ON COLUMN payment_generation_logs.target_month IS 'The month for which payments were generated (1-12)';
COMMENT ON COLUMN payment_generation_logs.target_year IS 'The year for which payments were generated';
COMMENT ON COLUMN payment_generation_logs.details IS 'JSONB array with details of each payment generated';
COMMENT ON COLUMN payment_generation_logs.errors IS 'JSONB array with details of any errors encountered';

-- ============================================================================
-- RLS POLICIES: payment_generation_logs
-- ============================================================================
ALTER TABLE payment_generation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and superadmins can view logs
CREATE POLICY "Admins can view payment generation logs"
  ON payment_generation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- System can insert logs (via service role)
CREATE POLICY "System can insert payment generation logs"
  ON payment_generation_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: Count student classes in a month (for per-class rates)
-- ============================================================================
CREATE OR REPLACE FUNCTION count_student_classes_in_month(
  p_student_enrollment_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT pc.id) INTO v_count
  FROM class_participants cp
  JOIN programmed_classes pc ON pc.id = cp.class_id
  WHERE cp.student_enrollment_id = p_student_enrollment_id
    AND cp.status = 'active'
    AND pc.is_active = true
    AND pc.start_date >= p_period_start
    AND pc.start_date <= p_period_end;

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION count_student_classes_in_month IS 'Counts the number of active classes a student has in a given period. Used for per-class payment calculation.';

-- ============================================================================
-- FUNCTION: Auto-generate monthly payments for a specific billing day
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_generate_monthly_payments(
  p_billing_day INTEGER,
  p_target_month INTEGER DEFAULT NULL,
  p_target_year INTEGER DEFAULT NULL,
  p_triggered_by VARCHAR DEFAULT 'cron'
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
    'execution_time_ms', EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION auto_generate_monthly_payments IS 'Automatically generates payments for all active assignments with the specified billing day. Generates payments for the CURRENT month (pre-pay model).';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION count_student_classes_in_month TO authenticated;
GRANT EXECUTE ON FUNCTION count_student_classes_in_month TO service_role;
GRANT EXECUTE ON FUNCTION auto_generate_monthly_payments TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_monthly_payments TO service_role;

-- ============================================================================
-- FUNCTION: Trigger function for cron job
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_monthly_payment_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_day INTEGER;
  v_result JSONB;
BEGIN
  -- Get current day of month
  v_current_day := EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;

  -- Only process if current day is 1-28 (valid billing days)
  IF v_current_day > 28 THEN
    RAISE NOTICE 'Day % is not a valid billing day (1-28), skipping', v_current_day;
    RETURN;
  END IF;

  -- Generate payments for rates with this billing day
  v_result := auto_generate_monthly_payments(v_current_day, NULL, NULL, 'cron');

  RAISE NOTICE 'Payment generation completed: %', v_result;
END;
$$;

COMMENT ON FUNCTION trigger_monthly_payment_generation IS 'Trigger function called by pg_cron daily. Generates payments for rates whose billing_day matches the current day.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_monthly_payment_generation TO service_role;
