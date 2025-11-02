-- Debug version of handle_new_user with detailed logging
-- This will help us identify exactly where the error occurs

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
  -- Log the start
  RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
  RAISE NOTICE 'raw_user_meta_data: %', NEW.raw_user_meta_data;

  -- Extract and log club_id
  v_club_id := CASE
    WHEN NEW.raw_user_meta_data ->> 'club_id' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'club_id')::uuid
    ELSE NULL
  END;
  RAISE NOTICE 'Extracted club_id: %', v_club_id;

  -- Extract and log level
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

  -- Try to insert profile with explicit error handling
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

  -- Try to create student_enrollment with explicit error handling
  IF v_club_id IS NOT NULL AND v_role = 'player' THEN
    BEGIN
      RAISE NOTICE 'Attempting to insert student_enrollment...';

      INSERT INTO public.student_enrollments (
        full_name,
        email,
        club_id,
        student_profile_id,
        created_by_profile_id
      )
      VALUES (
        v_full_name,
        NEW.email,
        v_club_id,
        NEW.id,
        NEW.id
      )
      ON CONFLICT (email, club_id) DO NOTHING;

      RAISE NOTICE 'Student enrollment inserted successfully';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting student_enrollment: % %', SQLERRM, SQLSTATE;
        -- Don't fail the entire trigger if student_enrollment fails
        -- Just log the error
    END;
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
'DEBUG VERSION - Trigger function with detailed logging to diagnose signup issues';
