-- Fix the student_enrollments_player_select policy to avoid accessing auth.users

-- Drop the problematic player policy
DROP POLICY IF EXISTS "student_enrollments_player_select" ON student_enrollments;

-- Recreate it WITHOUT accessing auth.users
-- Players can only see enrollments by student_profile_id (not by email from auth.users)
CREATE POLICY "student_enrollments_player_select"
ON student_enrollments
FOR SELECT
USING (
  student_profile_id = auth.uid()
);

-- Verify the fix
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'student_enrollments'
  AND policyname = 'student_enrollments_player_select';
