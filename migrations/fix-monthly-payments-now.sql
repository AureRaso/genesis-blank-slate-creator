-- Script para ejecutar directamente en la base de datos
-- Esto arregla las políticas rotas de monthly_payments

-- Drop all existing policies on monthly_payments
DROP POLICY IF EXISTS "Players can view their own monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Players can mark their payments as paid" ON monthly_payments;
DROP POLICY IF EXISTS "Admins and trainers can view all club payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins and trainers can verify payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins can insert monthly payments" ON monthly_payments;

-- Recreate with correct column names
CREATE POLICY "Players can view their own monthly payments"
  ON monthly_payments
  FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE student_profile_id = auth.uid()
    )
  );

CREATE POLICY "Players can mark their payments as paid"
  ON monthly_payments
  FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE student_profile_id = auth.uid()
    )
    AND status = 'pendiente'
  )
  WITH CHECK (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE student_profile_id = auth.uid()
    )
    AND status IN ('en_revision')
  );

-- Recreate admin/trainer policies
CREATE POLICY "Admins and trainers can view all club payments"
  ON monthly_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.user_type IN ('club_admin', 'admin')
      AND p.club_id IN (
        SELECT se.club_id FROM student_enrollments se
        WHERE se.id = monthly_payments.student_enrollment_id
      )
    )
  );

CREATE POLICY "Admins and trainers can verify payments"
  ON monthly_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.user_type IN ('club_admin', 'admin', 'trainer')
      AND p.club_id IN (
        SELECT se.club_id FROM student_enrollments se
        WHERE se.id = monthly_payments.student_enrollment_id
      )
    )
  );

CREATE POLICY "Admins can insert monthly payments"
  ON monthly_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.user_type IN ('club_admin', 'admin')
    )
  );
