-- Add RLS policy for guardians to see their children's class_participants

-- First, check existing policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'class_participants';

-- Create policy for guardians to see their children's class participants
DROP POLICY IF EXISTS "class_participants_guardian_select" ON class_participants;

CREATE POLICY "class_participants_guardian_select"
ON class_participants
FOR SELECT
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
);

-- Verify the policy was created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'class_participants'
  AND policyname = 'class_participants_guardian_select';
