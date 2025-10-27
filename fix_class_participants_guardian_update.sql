-- Add UPDATE permission for guardians to confirm attendance for their children

-- Drop existing guardian policy
DROP POLICY IF EXISTS "class_participants_guardian_select" ON class_participants;

-- Create new policy with SELECT and UPDATE permissions
CREATE POLICY "class_participants_guardian_all"
ON class_participants
FOR ALL
USING (
  -- Allow if the student_enrollment belongs to one of the guardian's children
  student_enrollment_id IN (
    SELECT se.id
    FROM student_enrollments se
    WHERE se.student_profile_id IN (
      SELECT dependent_profile_id
      FROM account_dependents
      WHERE guardian_profile_id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Same check for UPDATE/INSERT
  student_enrollment_id IN (
    SELECT se.id
    FROM student_enrollments se
    WHERE se.student_profile_id IN (
      SELECT dependent_profile_id
      FROM account_dependents
      WHERE guardian_profile_id = auth.uid()
    )
  )
);

-- Verify the policy
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'class_participants'
  AND policyname = 'class_participants_guardian_all';
