-- ============================================================================
-- PAYMENT SYSTEM V2 - Complete payment management with rates and assignments
-- ============================================================================

-- ============================================================================
-- TABLE: payment_rates (Tarifas configurables por club)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Rate type and pricing
  rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('fija', 'por_clase')),
  periodicity VARCHAR(20) NOT NULL CHECK (periodicity IN ('mensual', 'trimestral', 'semestral', 'anual')),
  fixed_price DECIMAL(10,2), -- For 'fija' type
  price_per_class DECIMAL(10,2), -- For 'por_clase' type

  -- Billing configuration
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 28),
  due_days INTEGER NOT NULL DEFAULT 30, -- Days until payment is due after issue
  grace_days INTEGER NOT NULL DEFAULT 7, -- Days before due date to send reminder

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_pricing CHECK (
    (rate_type = 'fija' AND fixed_price IS NOT NULL AND fixed_price > 0) OR
    (rate_type = 'por_clase' AND price_per_class IS NOT NULL AND price_per_class > 0)
  )
);

-- Indexes
CREATE INDEX idx_payment_rates_club_id ON payment_rates(club_id);
CREATE INDEX idx_payment_rates_active ON payment_rates(club_id, is_active);

-- Comments
COMMENT ON TABLE payment_rates IS 'Tarifas de pago configurables por club (mensual, trimestral, etc.)';
COMMENT ON COLUMN payment_rates.rate_type IS 'fija = precio fijo por periodo, por_clase = precio multiplicado por clases asistidas';
COMMENT ON COLUMN payment_rates.periodicity IS 'Frecuencia de cobro: mensual, trimestral, semestral, anual';
COMMENT ON COLUMN payment_rates.billing_day IS 'Día del mes (1-28) en que se genera el pago pendiente';
COMMENT ON COLUMN payment_rates.due_days IS 'Días desde emisión hasta vencimiento (default 30)';
COMMENT ON COLUMN payment_rates.grace_days IS 'Días antes del vencimiento para enviar recordatorio (default 7)';

-- ============================================================================
-- TABLE: student_rate_assignments (Asignaciones de tarifas a alumnos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_rate_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  payment_rate_id UUID NOT NULL REFERENCES payment_rates(id) ON DELETE CASCADE,

  -- Assignment period
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means indefinite

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'pausada', 'finalizada')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate active assignments for same student
  CONSTRAINT unique_active_assignment UNIQUE (student_enrollment_id, payment_rate_id, start_date)
);

-- Indexes
CREATE INDEX idx_student_rate_assignments_student ON student_rate_assignments(student_enrollment_id);
CREATE INDEX idx_student_rate_assignments_rate ON student_rate_assignments(payment_rate_id);
CREATE INDEX idx_student_rate_assignments_status ON student_rate_assignments(status);
CREATE INDEX idx_student_rate_assignments_dates ON student_rate_assignments(start_date, end_date);

-- Comments
COMMENT ON TABLE student_rate_assignments IS 'Asignación de tarifas a alumnos con periodo de vigencia';
COMMENT ON COLUMN student_rate_assignments.start_date IS 'Fecha desde la que aplica la tarifa';
COMMENT ON COLUMN student_rate_assignments.end_date IS 'Fecha hasta la que aplica (NULL = indefinido)';
COMMENT ON COLUMN student_rate_assignments.status IS 'activa = generando pagos, pausada = temporalmente sin cobro, finalizada = terminada';

-- ============================================================================
-- TABLE: student_payments (Pagos generados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,

  -- Related rate (nullable for extra payments)
  payment_rate_id UUID REFERENCES payment_rates(id) ON DELETE SET NULL,
  rate_assignment_id UUID REFERENCES student_rate_assignments(id) ON DELETE SET NULL,

  -- Payment details
  concept VARCHAR(200) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),

  -- For 'por_clase' rates, track the classes included
  classes_count INTEGER,
  period_start DATE, -- Period this payment covers
  period_end DATE,

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Status flow: pendiente -> en_revision -> pagado
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'pagado')),

  -- Payment method (set by student when marking as paid)
  payment_method VARCHAR(20) CHECK (payment_method IN ('efectivo', 'tarjeta', 'bizum')),

  -- Extra payment flag
  is_extra_payment BOOLEAN NOT NULL DEFAULT false,

  -- Tracking dates
  student_marked_paid_at TIMESTAMPTZ, -- When student clicked "He pagado"
  admin_verified_at TIMESTAMPTZ, -- When admin confirmed payment
  reminder_sent_at TIMESTAMPTZ, -- When reminder email was sent

  -- Notes
  student_notes TEXT, -- Notes from student
  admin_notes TEXT, -- Notes from admin

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_student_payments_club ON student_payments(club_id);
CREATE INDEX idx_student_payments_student ON student_payments(student_enrollment_id);
CREATE INDEX idx_student_payments_status ON student_payments(status);
CREATE INDEX idx_student_payments_due_date ON student_payments(due_date);
CREATE INDEX idx_student_payments_issue_date ON student_payments(issue_date);
CREATE INDEX idx_student_payments_rate ON student_payments(payment_rate_id);
CREATE INDEX idx_student_payments_pending ON student_payments(club_id, status) WHERE status = 'pendiente';

-- Comments
COMMENT ON TABLE student_payments IS 'Pagos generados para alumnos (automáticos por tarifa o extras manuales)';
COMMENT ON COLUMN student_payments.is_extra_payment IS 'true = pago añadido manualmente, false = generado por tarifa';
COMMENT ON COLUMN student_payments.student_marked_paid_at IS 'Momento en que el alumno marcó como pagado';
COMMENT ON COLUMN student_payments.admin_verified_at IS 'Momento en que el admin verificó el pago';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- Trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_payment_rates_updated_at ON payment_rates;
CREATE TRIGGER update_payment_rates_updated_at
  BEFORE UPDATE ON payment_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_rate_assignments_updated_at ON student_rate_assignments;
CREATE TRIGGER update_student_rate_assignments_updated_at
  BEFORE UPDATE ON student_rate_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_payments_updated_at ON student_payments;
CREATE TRIGGER update_student_payments_updated_at
  BEFORE UPDATE ON student_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES: payment_rates
-- ============================================================================
ALTER TABLE payment_rates ENABLE ROW LEVEL SECURITY;

-- Admins can manage rates for their club
CREATE POLICY "Admins can view payment rates"
  ON payment_rates FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can create payment rates"
  ON payment_rates FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can update payment rates"
  ON payment_rates FOR UPDATE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can delete payment rates"
  ON payment_rates FOR DELETE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ============================================================================
-- RLS POLICIES: student_rate_assignments
-- ============================================================================
ALTER TABLE student_rate_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage assignments for their club's students
CREATE POLICY "Admins can view rate assignments"
  ON student_rate_assignments FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can create rate assignments"
  ON student_rate_assignments FOR INSERT
  WITH CHECK (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can update rate assignments"
  ON student_rate_assignments FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can delete rate assignments"
  ON student_rate_assignments FOR DELETE
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Students can view their own assignments
CREATE POLICY "Students can view own rate assignments"
  ON student_rate_assignments FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: student_payments
-- ============================================================================
ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all payments for their club
CREATE POLICY "Admins can view student payments"
  ON student_payments FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can create student payments"
  ON student_payments FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can update student payments"
  ON student_payments FOR UPDATE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can delete student payments"
  ON student_payments FOR DELETE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Students can view their own payments
CREATE POLICY "Students can view own payments"
  ON student_payments FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
  );

-- Students can update their own payments (to mark as paid)
CREATE POLICY "Students can mark own payments as paid"
  ON student_payments FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
    AND status = 'pendiente' -- Can only update pending payments
  )
  WITH CHECK (
    status = 'en_revision' -- Can only change to 'en_revision'
    AND payment_method IS NOT NULL -- Must provide payment method
  );

-- Guardians can view payments of their dependents
CREATE POLICY "Guardians can view dependent payments"
  ON student_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );

-- Guardians can mark payments of their dependents as paid
CREATE POLICY "Guardians can mark dependent payments as paid"
  ON student_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
    AND status = 'pendiente'
  )
  WITH CHECK (
    status = 'en_revision'
    AND payment_method IS NOT NULL
  );

-- ============================================================================
-- FUNCTION: Generate payment for a rate assignment
-- (To be called by cron job or manually)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_payment_for_assignment(
  p_assignment_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_classes_count INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_assignment student_rate_assignments%ROWTYPE;
  v_rate payment_rates%ROWTYPE;
  v_enrollment student_enrollments%ROWTYPE;
  v_amount DECIMAL(10,2);
  v_concept VARCHAR(200);
  v_payment_id UUID;
BEGIN
  -- Get assignment
  SELECT * INTO v_assignment FROM student_rate_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found: %', p_assignment_id;
  END IF;

  -- Get rate
  SELECT * INTO v_rate FROM payment_rates WHERE id = v_assignment.payment_rate_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rate not found: %', v_assignment.payment_rate_id;
  END IF;

  -- Get enrollment
  SELECT * INTO v_enrollment FROM student_enrollments WHERE id = v_assignment.student_enrollment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', v_assignment.student_enrollment_id;
  END IF;

  -- Calculate amount
  IF v_rate.rate_type = 'fija' THEN
    v_amount := v_rate.fixed_price;
  ELSE
    -- por_clase
    IF p_classes_count IS NULL OR p_classes_count <= 0 THEN
      RAISE EXCEPTION 'Classes count required for per-class rate';
    END IF;
    v_amount := v_rate.price_per_class * p_classes_count;
  END IF;

  -- Generate concept
  v_concept := v_rate.name || ' - ' || TO_CHAR(p_period_start, 'MM/YYYY');

  -- Insert payment
  INSERT INTO student_payments (
    club_id,
    student_enrollment_id,
    payment_rate_id,
    rate_assignment_id,
    concept,
    amount,
    classes_count,
    period_start,
    period_end,
    issue_date,
    due_date,
    status,
    is_extra_payment
  ) VALUES (
    v_enrollment.club_id,
    v_assignment.student_enrollment_id,
    v_rate.id,
    v_assignment.id,
    v_concept,
    v_amount,
    p_classes_count,
    p_period_start,
    p_period_end,
    CURRENT_DATE,
    CURRENT_DATE + v_rate.due_days,
    'pendiente',
    false
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Create extra payment for a student
-- ============================================================================
CREATE OR REPLACE FUNCTION create_extra_payment(
  p_club_id UUID,
  p_student_enrollment_id UUID,
  p_concept VARCHAR(200),
  p_amount DECIMAL(10,2),
  p_description TEXT DEFAULT NULL,
  p_due_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_due_date DATE;
BEGIN
  -- Set due date (default 30 days from now)
  v_due_date := COALESCE(p_due_date, CURRENT_DATE + 30);

  -- Insert extra payment
  INSERT INTO student_payments (
    club_id,
    student_enrollment_id,
    concept,
    description,
    amount,
    issue_date,
    due_date,
    status,
    is_extra_payment
  ) VALUES (
    p_club_id,
    p_student_enrollment_id,
    p_concept,
    p_description,
    p_amount,
    CURRENT_DATE,
    v_due_date,
    'pendiente',
    true
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_payment_for_assignment TO authenticated;
GRANT EXECUTE ON FUNCTION create_extra_payment TO authenticated;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================
COMMENT ON FUNCTION generate_payment_for_assignment IS 'Generates a payment for a given rate assignment and period. Used by cron jobs or manual generation.';
COMMENT ON FUNCTION create_extra_payment IS 'Creates an extra/manual payment for a student (e.g., additional class, equipment, etc.)';
