-- Add UPDATE policy for student_enrollments to allow users to update their own phone number
-- This is needed for the phone required modal functionality

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own enrollment phone" ON student_enrollments;

-- Create policy to allow users to update their own enrollment
-- Users can update if:
-- 1. They created the enrollment (created_by_profile_id matches)
-- 2. OR they are the student (student_profile_id matches)
CREATE POLICY "Users can update their own enrollment phone"
ON student_enrollments
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by_profile_id
  OR auth.uid() = student_profile_id
)
WITH CHECK (
  auth.uid() = created_by_profile_id
  OR auth.uid() = student_profile_id
);

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'UPDATE policy for student_enrollments created successfully';
END $$;
