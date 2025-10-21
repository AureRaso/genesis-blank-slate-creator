-- Fix handle_new_user function to respect the role from user_metadata
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    -- Respect the role from user_metadata, default to 'player' if not provided
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'player'),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'club_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'club_id')::uuid
      ELSE NULL
    END,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'level' IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'level')::numeric
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile with correct role (guardian/player) and level when a new user signs up';
