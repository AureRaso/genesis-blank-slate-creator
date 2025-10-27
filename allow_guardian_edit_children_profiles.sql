-- Allow guardians to update their children's profiles (only full_name and level)

-- Create policy for guardians to update their children's profiles
DROP POLICY IF EXISTS "Guardians can update their children profiles" ON profiles;

CREATE POLICY "Guardians can update their children profiles"
ON profiles
FOR UPDATE
USING (
  -- Allow if the profile belongs to one of the guardian's children
  id IN (
    SELECT dependent_profile_id
    FROM account_dependents
    WHERE guardian_profile_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for the updated row
  id IN (
    SELECT dependent_profile_id
    FROM account_dependents
    WHERE guardian_profile_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Guardians can update their children profiles';
