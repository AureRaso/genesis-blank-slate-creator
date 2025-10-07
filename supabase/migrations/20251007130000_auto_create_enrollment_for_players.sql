-- Update handle_new_user function to auto-create enrollment for players
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_club_id uuid;
  v_level numeric;
  v_trainer_id uuid;
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

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    'player',
    v_club_id,
    v_level
  );

  -- If player has club_id, auto-create enrollment
  IF v_club_id IS NOT NULL THEN
    -- Get a trainer from the club (prefer the first one)
    SELECT trainer_profile_id INTO v_trainer_id
    FROM public.trainer_clubs
    WHERE club_id = v_club_id
    LIMIT 1;

    -- If no trainer found, try to get club owner
    IF v_trainer_id IS NULL THEN
      SELECT created_by_profile_id INTO v_trainer_id
      FROM public.clubs
      WHERE id = v_club_id
      LIMIT 1;
    END IF;

    -- Create enrollment if we found a trainer
    IF v_trainer_id IS NOT NULL THEN
      INSERT INTO public.student_enrollments (
        trainer_profile_id,
        club_id,
        created_by_profile_id,
        full_name,
        email,
        phone,
        level,
        weekly_days,
        preferred_times,
        enrollment_period,
        status,
        enrollment_date
      ) VALUES (
        v_trainer_id,
        v_club_id,
        NEW.id, -- Created by the user themselves
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'phone', '000000000'),
        COALESCE(v_level, 3.0),
        ARRAY[]::text[], -- Empty array, will be filled later
        ARRAY[]::text[], -- Empty array, will be filled later
        'mensual',
        'active',
        CURRENT_DATE
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile and auto-enrollment when a new player signs up';
