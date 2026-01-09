-- Add RLS policies for guardians to manage attendance confirmations of their dependents
-- These policies ONLY affect users with role='guardian' and do NOT modify existing policies for other roles

-- Policy for guardians to SELECT attendance records of their dependents
CREATE POLICY "Guardians can view dependent attendance records"
  ON class_attendance_confirmations FOR SELECT
  USING (
    -- Only applies to users with guardian role
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    -- Guardian can only see records for their dependents
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );

-- Policy for guardians to UPDATE attendance records of their dependents
CREATE POLICY "Guardians can update dependent attendance records"
  ON class_attendance_confirmations FOR UPDATE
  USING (
    -- Only applies to users with guardian role
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    -- Guardian can only update records for their dependents
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );

-- Policy for guardians to INSERT attendance records for their dependents
CREATE POLICY "Guardians can insert dependent attendance records"
  ON class_attendance_confirmations FOR INSERT
  WITH CHECK (
    -- Only applies to users with guardian role
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    -- Guardian can only insert records for their dependents
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Guardians can view dependent attendance records" ON class_attendance_confirmations IS
  'Allows guardians to view attendance records for students they are responsible for (via account_dependents table)';

COMMENT ON POLICY "Guardians can update dependent attendance records" ON class_attendance_confirmations IS
  'Allows guardians to mark attendance/absence for students they are responsible for (via account_dependents table)';

COMMENT ON POLICY "Guardians can insert dependent attendance records" ON class_attendance_confirmations IS
  'Allows guardians to create attendance records for students they are responsible for (via account_dependents table)';
