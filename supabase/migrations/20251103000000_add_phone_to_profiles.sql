-- Add phone field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update handle_new_user trigger to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _club_id UUID;
  _level NUMERIC(3, 1);
  _role TEXT;
  _phone TEXT;
BEGIN
  -- Extract metadata from user
  _club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
  _level := (NEW.raw_user_meta_data->>'level')::NUMERIC(3, 1);
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'player');
  _phone := NEW.raw_user_meta_data->>'phone';

  -- Insert profile with all fields including phone
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    _role,
    _club_id,
    _level,
    _phone
  );

  RETURN NEW;
END;
$$;
