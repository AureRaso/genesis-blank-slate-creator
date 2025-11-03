-- Fix ON CONFLICT issue - just try to insert, if it fails it fails silently

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
    -- Try to insert the enrollment
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
    );
  END IF;

EXCEPTION
  WHEN unique_violation THEN
    -- Enrollment already exists, update it instead
    UPDATE public.student_enrollments
    SET
      phone = COALESCE(p_phone, ''),
      level = COALESCE(p_level, 1.0),
      updated_at = now()
    WHERE email = p_email AND club_id = p_club_id;
  WHEN OTHERS THEN
    -- Log any other error but don't block user signup
    RAISE WARNING 'Failed to create enrollment for %: % (SQLSTATE: %)', p_email, SQLERRM, SQLSTATE;
END;
$$;

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid, text, numeric) IS
'Helper function to create student_enrollment - handles conflicts gracefully';
