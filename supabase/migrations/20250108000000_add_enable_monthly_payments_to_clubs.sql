-- Add field to enable/disable monthly payments functionality per club
-- This allows clubs to opt-in to the monthly payment control system

ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS enable_monthly_payments BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN clubs.enable_monthly_payments IS 'Habilita el sistema de control de pagos mensuales para este club. Solo los clubes con esta opcion activada veran el modulo de pagos mensuales en el panel de administracion.';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_clubs_enable_monthly_payments ON clubs(enable_monthly_payments);

-- Update RLS policies for monthly_payments to check if club has this feature enabled

-- Drop existing policies first
DROP POLICY IF EXISTS "Players can view their own monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Players can mark their payments as paid" ON monthly_payments;
DROP POLICY IF EXISTS "Admins and trainers can view all club payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins and trainers can verify payments" ON monthly_payments;

-- Recreate policies with club feature check

-- Players can view their own payments (only if club has feature enabled)
CREATE POLICY "Players can view their own monthly payments"
  ON monthly_payments FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      JOIN clubs c ON c.id = se.club_id
      WHERE p.id = auth.uid()
        AND c.enable_monthly_payments = true
    )
  );

-- Players can mark their payments as paid (only if club has feature enabled)
CREATE POLICY "Players can mark their payments as paid"
  ON monthly_payments FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      JOIN clubs c ON c.id = se.club_id
      WHERE p.id = auth.uid()
        AND c.enable_monthly_payments = true
    )
    AND status = 'pendiente'
  )
  WITH CHECK (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      JOIN clubs c ON c.id = se.club_id
      WHERE p.id = auth.uid()
        AND c.enable_monthly_payments = true
    )
    AND status IN ('en_revision')
  );

-- Admins and trainers can view all club payments (only if club has feature enabled)
CREATE POLICY "Admins and trainers can view all club payments"
  ON monthly_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN student_enrollments se ON se.id = monthly_payments.student_enrollment_id
      JOIN clubs c ON c.id = se.club_id
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR p.role = 'trainer')
        AND p.club_id = se.club_id
        AND c.enable_monthly_payments = true
    )
  );

-- Admins and trainers can verify/update payments (only if club has feature enabled)
CREATE POLICY "Admins and trainers can verify payments"
  ON monthly_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN student_enrollments se ON se.id = monthly_payments.student_enrollment_id
      JOIN clubs c ON c.id = se.club_id
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR p.role = 'trainer')
        AND p.club_id = se.club_id
        AND c.enable_monthly_payments = true
    )
  );

-- Keep the system insert policy unchanged (for triggers and functions)
DROP POLICY IF EXISTS "System can insert monthly payments" ON monthly_payments;
CREATE POLICY "System can insert monthly payments"
  ON monthly_payments FOR INSERT
  WITH CHECK (true);
