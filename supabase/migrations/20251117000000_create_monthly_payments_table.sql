-- Create monthly_payments table
CREATE TABLE IF NOT EXISTS monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'pagado')),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'bizum', 'transferencia', 'tarjeta')),
  marked_paid_at TIMESTAMPTZ, -- Cuando el jugador marca como pagado
  verified_paid_at TIMESTAMPTZ, -- Cuando el admin/profesor confirma
  verified_by UUID REFERENCES profiles(id), -- Quien verificó el pago
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar duplicados: un estudiante solo puede tener un pago por clase y mes
  UNIQUE(student_enrollment_id, class_id, month, year)
);

-- Add RLS policies
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;

-- Policy for players to view their own payments
CREATE POLICY "Players can view their own monthly payments"
  ON monthly_payments
  FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE user_id = auth.uid()
    )
  );

-- Policy for players to update their own payments (only to mark as paid)
CREATE POLICY "Players can mark their payments as paid"
  ON monthly_payments
  FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE user_id = auth.uid()
    )
    AND status = 'pendiente'
  )
  WITH CHECK (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE user_id = auth.uid()
    )
    AND status IN ('en_revision')
  );

-- Policy for admins/trainers to view all payments in their club
CREATE POLICY "Admins and trainers can view all club payments"
  ON monthly_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'trainer')
      AND p.club_id IN (
        SELECT se.club_id FROM student_enrollments se
        WHERE se.id = monthly_payments.student_enrollment_id
      )
    )
  );

-- Policy for admins/trainers to update payment status
CREATE POLICY "Admins and trainers can verify payments"
  ON monthly_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'trainer')
      AND p.club_id IN (
        SELECT se.club_id FROM student_enrollments se
        WHERE se.id = monthly_payments.student_enrollment_id
      )
    )
  );

-- Policy for system to insert payments
CREATE POLICY "Admins can insert monthly payments"
  ON monthly_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create index for performance
CREATE INDEX idx_monthly_payments_student ON monthly_payments(student_enrollment_id);
CREATE INDEX idx_monthly_payments_class ON monthly_payments(class_id);
CREATE INDEX idx_monthly_payments_month_year ON monthly_payments(month, year);
CREATE INDEX idx_monthly_payments_status ON monthly_payments(status);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_monthly_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_payments_updated_at
  BEFORE UPDATE ON monthly_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payments_updated_at();

-- Create function to automatically generate monthly payments when a student enrolls in a class
CREATE OR REPLACE FUNCTION generate_monthly_payments_for_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  class_record RECORD;
  current_month INTEGER;
  current_year INTEGER;
  end_month INTEGER;
  end_year INTEGER;
BEGIN
  -- Get class details
  SELECT * INTO class_record FROM programmed_classes WHERE id = NEW.class_id;

  -- Extract start month/year
  current_month := EXTRACT(MONTH FROM class_record.start_date);
  current_year := EXTRACT(YEAR FROM class_record.start_date);

  -- Extract end month/year
  end_month := EXTRACT(MONTH FROM class_record.end_date);
  end_year := EXTRACT(YEAR FROM class_record.end_date);

  -- Generate payments for each month
  WHILE (current_year < end_year) OR (current_year = end_year AND current_month <= end_month) LOOP
    INSERT INTO monthly_payments (
      student_enrollment_id,
      class_id,
      month,
      year,
      amount,
      status
    ) VALUES (
      NEW.student_enrollment_id,
      NEW.class_id,
      current_month,
      current_year,
      class_record.monthly_price,
      'pendiente'
    )
    ON CONFLICT (student_enrollment_id, class_id, month, year) DO NOTHING;

    -- Increment month
    current_month := current_month + 1;
    IF current_month > 12 THEN
      current_month := 1;
      current_year := current_year + 1;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate payments when a student joins a class
CREATE TRIGGER generate_monthly_payments_on_enrollment
  AFTER INSERT ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION generate_monthly_payments_for_enrollment();
