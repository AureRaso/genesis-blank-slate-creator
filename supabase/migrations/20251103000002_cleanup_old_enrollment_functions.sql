-- Drop all old versions of create_student_enrollment_for_signup
-- Keep only the version with phone and level parameters

-- Drop the old version with 4 parameters (p_user_id, p_email, p_full_name, p_club_id)
DROP FUNCTION IF EXISTS public.create_student_enrollment_for_signup(uuid, text, text, uuid);

-- Drop the version with 5 parameters (p_user_id, p_email, p_full_name, p_club_id, p_level)
DROP FUNCTION IF EXISTS public.create_student_enrollment_for_signup(uuid, text, text, uuid, numeric);

-- The version with 6 parameters (including phone) should already exist from the previous migration
-- But let's recreate it to be sure it's correct

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

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid, text, numeric) IS
'Helper function with SECURITY DEFINER to create student_enrollment with phone and level';
