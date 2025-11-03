-- Fix create_student_enrollment_for_signup to include phone and level
-- These fields are now required in student_enrollments table

CREATE OR REPLACE FUNCTION public.create_student_enrollment_for_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_club_id uuid,
  p_phone text,
  p_level numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trainer_id uuid;
BEGIN
  -- Find a trainer for this club
  -- First try to find via trainer_clubs
  SELECT trainer_profile_id INTO v_trainer_id
  FROM trainer_clubs
  WHERE club_id = p_club_id
  LIMIT 1;

  -- If no trainer found via trainer_clubs, try profiles
  IF v_trainer_id IS NULL THEN
    SELECT id INTO v_trainer_id
    FROM profiles
    WHERE club_id = p_club_id
      AND role = 'trainer'
    LIMIT 1;
  END IF;

  -- If still no trainer, try to find any admin
  IF v_trainer_id IS NULL THEN
    SELECT id INTO v_trainer_id
    FROM profiles
    WHERE role = 'admin'
    LIMIT 1;
  END IF;

  -- If we have a trainer, create the enrollment
  IF v_trainer_id IS NOT NULL THEN
    INSERT INTO public.student_enrollments (
      trainer_profile_id,
      full_name,
      email,
      phone,
      level,
      club_id,
      student_profile_id,
      created_by_profile_id,
      status
    )
    VALUES (
      v_trainer_id,
      p_full_name,
      p_email,
      COALESCE(p_phone, ''),
      COALESCE(p_level, 1.0),
      p_club_id,
      p_user_id,
      p_user_id,
      'active'
    )
    ON CONFLICT (email, club_id) DO NOTHING;

    RAISE NOTICE 'Student enrollment created/updated for: %', p_email;
  ELSE
    RAISE NOTICE 'No trainer or admin found for club %, skipping enrollment creation', p_club_id;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in create_student_enrollment_for_signup: % %', SQLERRM, SQLSTATE;
    -- Don't re-raise, just log the error
END;
$$;

-- Update handle_new_user to pass phone and level to create_student_enrollment_for_signup
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
  v_phone text;
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

  -- Extract phone
  v_phone := NEW.raw_user_meta_data ->> 'phone';
  RAISE NOTICE 'Extracted phone: %', v_phone;

  -- Insert profile
  BEGIN
    RAISE NOTICE 'Attempting to insert profile...';

    INSERT INTO public.profiles (id, email, full_name, role, club_id, level, phone)
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_role,
      v_club_id,
      v_level,
      v_phone
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
      v_club_id,
      v_phone,
      v_level
    );
  ELSE
    RAISE NOTICE 'Skipping student_enrollment (club_id: %, role: %)', v_club_id, v_role;
  END IF;

  RAISE NOTICE 'handle_new_user completed successfully';
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid, text, numeric) IS
'Helper function with SECURITY DEFINER to create student_enrollment with phone and level';
