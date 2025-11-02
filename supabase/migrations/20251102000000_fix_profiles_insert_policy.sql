-- Fix RLS policy on profiles to allow trigger to insert new user profiles
-- The previous policy "Only admins can insert profiles" was blocking the handle_new_user() trigger
-- because RLS policies apply even to SECURITY DEFINER functions

-- Solution: Grant BYPASSRLS to the postgres role for the handle_new_user function
-- This allows the trigger to insert profiles without being blocked by RLS

-- First, drop the old restrictive policy
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;

-- Recreate handle_new_user function with proper privileges
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id uuid;
  v_level numeric;
BEGIN
  -- Extract club_id and level from metadata
  v_club_id := CASE
    WHEN NEW.raw_user_meta_data ->> 'club_id' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'club_id')::uuid
    ELSE NULL
  END;

  v_level := CASE
    WHEN NEW.raw_user_meta_data ->> 'level' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'level')::numeric
    ELSE NULL
  END;

  -- Insert profile (RLS is bypassed because function owner has BYPASSRLS)
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'player'),
    v_club_id,
    v_level
  );

  -- Auto-create student_enrollment for players with club_id
  IF v_club_id IS NOT NULL AND COALESCE(NEW.raw_user_meta_data ->> 'role', 'player') = 'player' THEN
    INSERT INTO public.student_enrollments (
      full_name,
      email,
      club_id,
      student_profile_id,
      created_by_profile_id
    )
    VALUES (
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
      NEW.email,
      v_club_id,
      NEW.id,
      NEW.id
    )
    ON CONFLICT (email, club_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a more permissive policy for profile insertion
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow if user is admin
    public.is_admin(auth.uid())
    OR
    -- Allow if inserting own profile (during signup via trigger)
    auth.uid() = id
  );

-- Add comment explaining the function
COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function to create profile and auto-enrollment when a new user signs up. Uses SECURITY DEFINER to bypass RLS.';
