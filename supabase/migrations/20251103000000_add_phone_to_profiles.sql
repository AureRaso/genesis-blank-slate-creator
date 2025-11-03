-- Add phone field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update handle_new_user trigger to include phone
-- This preserves the existing logic for creating student_enrollment
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
      v_club_id
    );
  ELSE
    RAISE NOTICE 'Skipping student_enrollment (club_id: %, role: %)', v_club_id, v_role;
  END IF;

  RAISE NOTICE 'handle_new_user completed successfully';
  RETURN NEW;
END;
$$;
