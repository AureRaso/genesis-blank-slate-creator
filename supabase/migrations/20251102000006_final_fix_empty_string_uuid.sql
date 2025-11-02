-- FINAL FIX: Handle empty string club_id before UUID conversion
-- Issue: club_id arriving as empty string "" instead of NULL causes "invalid input syntax for type uuid"

-- Fix handle_new_user trigger to validate empty strings before UUID conversion
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
  v_club_id_text text;
BEGIN
  -- Extract club_id as text first
  v_club_id_text := NEW.raw_user_meta_data ->> 'club_id';

  -- Validate: only convert to UUID if string is not empty
  IF v_club_id_text IS NOT NULL AND v_club_id_text != '' THEN
    v_club_id := v_club_id_text::uuid;
    RAISE WARNING 'club_id converted to UUID: %', v_club_id;
  ELSE
    v_club_id := NULL;
    RAISE WARNING 'club_id is NULL or empty, setting to NULL';
  END IF;

  -- Extract level (default to 3 if not provided)
  v_level := COALESCE((NEW.raw_user_meta_data ->> 'level')::numeric, 3);

  -- Extract role (default to 'player')
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'player');

  -- Extract full_name (default to 'Usuario')
  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario');

  RAISE WARNING 'Creating profile - user_id: %, email: %, club_id: %, role: %', NEW.id, NEW.email, v_club_id, v_role;

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_club_id, v_level);

  RAISE WARNING 'Profile created successfully';

  -- Create student_enrollment for players with club_id
  IF v_club_id IS NOT NULL AND v_role = 'player' THEN
    RAISE WARNING 'Calling create_student_enrollment_for_signup...';
    PERFORM public.create_student_enrollment_for_signup(
      NEW.id,
      NEW.email,
      v_full_name,
      v_club_id,
      v_level
    );
  ELSE
    RAISE WARNING 'Skipping enrollment - club_id: %, role: %', v_club_id, v_role;
  END IF;

  RAISE WARNING 'handle_new_user completed successfully';
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Update create_student_enrollment_for_signup to handle NULL club_id gracefully
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

  -- Only proceed if club_id is not NULL
  IF p_club_id IS NULL THEN
    RAISE WARNING 'club_id is NULL, skipping enrollment creation';
    RETURN;
  END IF;

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

  RAISE WARNING 'Inserting enrollment - user: %, club: %, trainer: %', p_user_id, p_club_id, v_trainer_id;

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

  RAISE WARNING 'Student enrollment created for: % (trainer: %)', p_email, v_trainer_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR in create_student_enrollment_for_signup: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function to create profile and student_enrollment. Fixed to handle empty string club_id values.';

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid, numeric) IS
'Helper function to create student_enrollment with all required fields. Handles NULL club_id gracefully.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Empty string UUID validation added to handle_new_user trigger';
END $$;
