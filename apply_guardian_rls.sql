-- Create policy to allow guardians to view their children's enrollments
DROP POLICY IF EXISTS "Guardians can view their children's enrollments" ON student_enrollments;

CREATE POLICY "Guardians can view their children's enrollments"
ON student_enrollments
FOR SELECT
USING (
  student_profile_id IN (
    SELECT dependent_profile_id
    FROM account_dependents
    WHERE guardian_profile_id = auth.uid()
  )
  OR
  email IN (
    SELECT p.email
    FROM account_dependents ad
    JOIN profiles p ON p.id = ad.dependent_profile_id
    WHERE ad.guardian_profile_id = auth.uid()
  )
);
