-- Add UPDATE policy for profiles to allow users to update their own phone number
-- This is needed for the phone required modal functionality

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own profile phone" ON profiles;

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile phone"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'UPDATE policy for profiles created successfully';
END $$;
