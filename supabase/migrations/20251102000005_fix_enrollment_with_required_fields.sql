-- Fix: Include ALL required fields in student_enrollment creation
-- Fields required (NOT NULL): trainer_profile_id, phone, level

CREATE OR REPLACE FUNCTION public.create_student_enrollment_for_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_club_id uuid,
  p_level numeric DEFAULT 3
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id uuid;
BEGIN
  -- Disable RLS for this transaction
  SET LOCAL row_security = off;

  -- Find a trainer for this club (required field)
  -- Try to find any trainer/admin/owner from the club
  SELECT id INTO v_trainer_id
  FROM profiles
  WHERE club_id = p_club_id
    AND role IN ('trainer', 'admin', 'owner')
  LIMIT 1;

  -- If no trainer found, use the first admin/owner in the system
  IF v_trainer_id IS NULL THEN
    SELECT id INTO v_trainer_id
    FROM profiles
    WHERE role IN ('admin', 'owner')
    LIMIT 1;
  END IF;

  -- If still no trainer, use the user themselves as a fallback
  IF v_trainer_id IS NULL THEN
    v_trainer_id := p_user_id;
  END IF;

  -- Insert student_enrollment with ALL required fields
  INSERT INTO public.student_enrollments (
    full_name,
    email,
    phone,
    level,
    club_id,
    student_profile_id,
    created_by_profile_id,
    trainer_profile_id,
    status
  )
  VALUES (
    p_full_name,
    p_email,
    '', -- phone empty string (required field)
    p_level, -- level (required field)
    p_club_id,
    p_user_id,
    p_user_id,
    v_trainer_id, -- trainer_profile_id (required field)
    'active'
  )
  ON CONFLICT (email, club_id) DO NOTHING;

  RAISE NOTICE 'Student enrollment created for: % (trainer: %)', p_email, v_trainer_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in create_student_enrollment_for_signup: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Update handle_new_user to pass level to the helper function
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
  -- Extract club_id
  v_club_id := CASE
    WHEN NEW.raw_user_meta_data ->> 'club_id' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'club_id')::uuid
    ELSE NULL
  END;

  -- Extract level (default to 3 if not provided)
  v_level := CASE
    WHEN NEW.raw_user_meta_data ->> 'level' IS NOT NULL
    THEN (NEW.raw_user_meta_data ->> 'level')::numeric
    ELSE 3
  END;

  -- Extract role
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'player');

  -- Extract full_name
  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario');

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_club_id, v_level);

  -- Create student_enrollment for players with club_id
  IF v_club_id IS NOT NULL AND v_role = 'player' THEN
    PERFORM public.create_student_enrollment_for_signup(
      NEW.id,
      NEW.email,
      v_full_name,
      v_club_id,
      v_level -- Pass level to the function
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid, numeric) IS
'Helper function to create student_enrollment with all required fields including trainer_id, phone, and level';
