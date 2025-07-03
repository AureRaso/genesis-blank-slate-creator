
-- First, let's update the trainers table to remove redundant fields that should come from profiles
ALTER TABLE public.trainers 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS club_id;

-- Update the create_trainer_user function to work properly with the new structure
CREATE OR REPLACE FUNCTION public.create_trainer_user(
  trainer_email TEXT,
  trainer_full_name TEXT,
  club_id UUID,
  trainer_phone TEXT DEFAULT '',
  trainer_specialty TEXT DEFAULT NULL,
  trainer_photo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  random_password TEXT;
  new_user_id UUID;
  trainer_record RECORD;
  existing_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = trainer_email;

  IF existing_user_id IS NOT NULL THEN
    RETURN json_build_object(
      'error', 'Ya existe un usuario con este email: ' || trainer_email
    );
  END IF;

  -- Generate random password
  random_password := encode(gen_random_bytes(9), 'base64');
  
  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    trainer_email,
    crypt(random_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('full_name', trainer_full_name, 'phone', trainer_phone),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create profile with trainer role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, trainer_email, trainer_full_name, 'trainer');

  -- Create trainer record
  INSERT INTO public.trainers (
    profile_id,
    specialty,
    photo_url,
    is_active
  ) VALUES (
    new_user_id,
    trainer_specialty,
    trainer_photo_url,
    true
  ) RETURNING * INTO trainer_record;

  -- Create trainer-club relationship
  INSERT INTO public.trainer_clubs (
    trainer_profile_id,
    club_id
  ) VALUES (
    new_user_id,
    club_id
  );

  -- Return success with temporary password
  RETURN json_build_object(
    'user_id', new_user_id,
    'trainer_id', trainer_record.id,
    'email', trainer_email,
    'temporary_password', random_password,
    'full_name', trainer_full_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;
