-- Fix student_enrollment creation in handle_new_user trigger
-- The issue is that RLS policies may be blocking the trigger from inserting

-- Create a SECURITY DEFINER function to insert student_enrollment with elevated privileges
CREATE OR REPLACE FUNCTION public.create_student_enrollment_for_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_club_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert student_enrollment without being blocked by RLS
  INSERT INTO public.student_enrollments (
    full_name,
    email,
    club_id,
    student_profile_id,
    created_by_profile_id
  )
  VALUES (
    p_full_name,
    p_email,
    p_club_id,
    p_user_id,
    p_user_id
  )
  ON CONFLICT (email, club_id) DO NOTHING;

  RAISE NOTICE 'Student enrollment created/updated for: %', p_email;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in create_student_enrollment_for_signup: % %', SQLERRM, SQLSTATE;
    -- Don't re-raise, just log the error
END;
$$;

-- Update handle_new_user to use the new helper function
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
  v_role text;
  v_full_name text;
BEGIN
  RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
  RAISE NOTICE 'raw_user_meta_data: %', NEW.raw_user_meta_data;

  -- Extract club_id
  v_club_id := CASE
    WHEN NEW.raw_user_meta_data ->> 'club_id' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'club_id')::uuid
    ELSE NULL
  END;
  RAISE NOTICE 'Extracted club_id: %', v_club_id;

  -- Extract level
  v_level := CASE
    WHEN NEW.raw_user_meta_data ->> 'level' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'level')::numeric
    ELSE NULL
  END;
  RAISE NOTICE 'Extracted level: %', v_level;

  -- Extract role
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'player');
  RAISE NOTICE 'Extracted role: %', v_role;

  -- Extract full_name
  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario');
  RAISE NOTICE 'Extracted full_name: %', v_full_name;

  -- Insert profile
  BEGIN
    RAISE NOTICE 'Attempting to insert profile...';

    INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_role,
      v_club_id,
      v_level
    );

    RAISE NOTICE 'Profile inserted successfully';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERROR inserting profile: % %', SQLERRM, SQLSTATE;
      RAISE EXCEPTION 'Failed to insert profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;

  -- Create student_enrollment for players with club_id using helper function
  IF v_club_id IS NOT NULL AND v_role = 'player' THEN
    RAISE NOTICE 'Calling create_student_enrollment_for_signup...';
    PERFORM public.create_student_enrollment_for_signup(
      NEW.id,
      NEW.email,
      v_full_name,
      v_club_id
    );
  ELSE
    RAISE NOTICE 'Skipping student_enrollment (club_id: %, role: %)', v_club_id, v_role;
  END IF;

  RAISE NOTICE 'handle_new_user completed successfully';
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function to create profile and student_enrollment when a new user signs up';

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid) IS
'Helper function with SECURITY DEFINER to create student_enrollment bypassing RLS';
