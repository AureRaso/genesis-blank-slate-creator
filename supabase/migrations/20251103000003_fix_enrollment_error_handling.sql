-- Update create_student_enrollment_for_signup to NOT swallow errors silently
-- This will help us see what's actually failing

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
  RAISE NOTICE 'create_student_enrollment_for_signup called for: %', p_email;
  RAISE NOTICE 'Parameters: user_id=%, club_id=%, phone=%, level=%', p_user_id, p_club_id, p_phone, p_level;

  -- Find a trainer for this club
  -- First try to find via trainer_clubs
  SELECT trainer_profile_id INTO v_trainer_id
  FROM trainer_clubs
  WHERE club_id = p_club_id
  LIMIT 1;

  RAISE NOTICE 'Trainer from trainer_clubs: %', v_trainer_id;

  -- If no trainer found via trainer_clubs, try profiles
  IF v_trainer_id IS NULL THEN
    SELECT id INTO v_trainer_id
    FROM profiles
    WHERE club_id = p_club_id
      AND role = 'trainer'
    LIMIT 1;

    RAISE NOTICE 'Trainer from profiles: %', v_trainer_id;
  END IF;

  -- If still no trainer, try to find any admin
  IF v_trainer_id IS NULL THEN
    SELECT id INTO v_trainer_id
    FROM profiles
    WHERE role = 'admin'
    LIMIT 1;

    RAISE NOTICE 'Admin fallback: %', v_trainer_id;
  END IF;

  -- If we have a trainer, create the enrollment
  IF v_trainer_id IS NOT NULL THEN
    RAISE NOTICE 'Attempting to insert enrollment with trainer: %', v_trainer_id;

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

    RAISE NOTICE '✅ Student enrollment created/updated for: %', p_email;
  ELSE
    RAISE WARNING '⚠️ No trainer or admin found for club %, skipping enrollment creation', p_club_id;
  END IF;

  -- Don't catch exceptions - let them bubble up to see what's failing
END;
$$;

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid, text, numeric) IS
'Helper function with SECURITY DEFINER to create student_enrollment with phone and level - errors will now bubble up';
