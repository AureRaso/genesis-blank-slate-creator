-- Fix monthly_payments RLS policies to use correct column names
-- student_enrollments uses student_profile_id, not user_id

-- Drop existing policies
DROP POLICY IF EXISTS "Players can view their own monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Players can mark their payments as paid" ON monthly_payments;

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
