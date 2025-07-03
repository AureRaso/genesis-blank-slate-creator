
-- Verificar el estado actual y actualizar la tabla trainers para usar la nueva estructura
-- Primero, vamos a verificar si las columnas existen y hacer la migración paso a paso

-- 1. Agregar profile_id a trainers si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trainers' AND column_name = 'profile_id') THEN
        ALTER TABLE public.trainers ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Crear la tabla trainer_clubs si no existe
CREATE TABLE IF NOT EXISTS public.trainer_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_profile_id, club_id)
);

-- 3. Habilitar RLS en trainer_clubs si no está habilitado
ALTER TABLE public.trainer_clubs ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas para trainer_clubs si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainer_clubs' AND policyname = 'Admins can manage trainer clubs for their clubs') THEN
        CREATE POLICY "Admins can manage trainer clubs for their clubs" 
          ON public.trainer_clubs 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.clubs 
              WHERE clubs.id = trainer_clubs.club_id 
              AND clubs.created_by_profile_id = auth.uid()
            )
          );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainer_clubs' AND policyname = 'Trainers can view their assigned clubs') THEN
        CREATE POLICY "Trainers can view their assigned clubs" 
          ON public.trainer_clubs 
          FOR SELECT 
          USING (trainer_profile_id = auth.uid());
    END IF;
END $$;

-- 5. Actualizar la función create_trainer_user para manejar mejor los conflictos
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
  -- Verificar si ya existe un usuario con este email
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = trainer_email;

  IF existing_user_id IS NOT NULL THEN
    RETURN json_build_object(
      'error', 'Ya existe un usuario con este email: ' || trainer_email
    );
  END IF;

  -- Generar contraseña aleatoria de 12 caracteres
  random_password := encode(gen_random_bytes(9), 'base64');
  
  -- Crear el usuario en auth.users
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
    json_build_object('full_name', trainer_full_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Crear el perfil con rol trainer
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, trainer_email, trainer_full_name, 'trainer');

  -- Verificar si la tabla trainers tiene la nueva estructura (con profile_id)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'trainers' AND column_name = 'profile_id') THEN
    -- Nueva estructura: usar profile_id
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
  ELSE
    -- Estructura antigua: usar campos directos
    INSERT INTO public.trainers (
      full_name,
      email,
      phone,
      club_id,
      specialty,
      photo_url,
      is_active
    ) VALUES (
      trainer_full_name,
      trainer_email,
      trainer_phone,
      club_id,
      trainer_specialty,
      trainer_photo_url,
      true
    ) RETURNING * INTO trainer_record;
  END IF;

  -- Crear la relación trainer-club (solo si existe la tabla trainer_clubs)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainer_clubs') THEN
    INSERT INTO public.trainer_clubs (
      trainer_profile_id,
      club_id
    ) VALUES (
      new_user_id,
      club_id
    );
  END IF;

  -- Retornar información del usuario creado incluyendo la contraseña temporal
  RETURN json_build_object(
    'user_id', new_user_id,
    'trainer_id', trainer_record.id,
    'email', trainer_email,
    'temporary_password', random_password,
    'full_name', trainer_full_name
  );
  
EXCEPTION WHEN OTHERS THEN
  -- En caso de error, retornar el error
  RETURN json_build_object(
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;
