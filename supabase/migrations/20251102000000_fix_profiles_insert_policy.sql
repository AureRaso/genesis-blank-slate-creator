-- Fix RLS policy on profiles to allow trigger to insert new user profiles
-- The previous policy "Only admins can insert profiles" was blocking the handle_new_user() trigger
-- because the trigger runs in the context of the new user who is not yet an admin

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;

-- Create new policy that allows:
-- 1. Admins to insert any profile
-- 2. The trigger function to insert profiles (via SECURITY DEFINER)
-- 3. Users to insert their own profile during signup
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow if user is admin
    public.is_admin(auth.uid())
    OR
    -- Allow if inserting own profile (during signup via trigger)
    auth.uid() = id
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Allow profile creation during signup" ON public.profiles IS
'Allows admins to create any profile, and users to create their own profile during signup via the handle_new_user trigger';
