-- Add RLS policy to allow admins to update player profiles
-- This is needed so admins can update player levels from the admin panel

CREATE POLICY "Admins can update player profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- The current user must be an admin
  EXISTS (
    SELECT 1
    FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
  )
  AND
  -- The profile being updated must be a player
  role = 'player'
)
WITH CHECK (
  -- The current user must be an admin
  EXISTS (
    SELECT 1
    FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
  )
  AND
  -- The profile being updated must remain a player
  role = 'player'
);
