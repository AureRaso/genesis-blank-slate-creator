
-- Función para crear un usuario trainer con contraseña aleatoria
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
BEGIN
  -- Generar contraseña aleatoria de 12 caracteres
  random_password := encode(gen_random_bytes(9), 'base64');
  
  -- Crear el usuario en auth.users usando la API administrativa
  -- Nota: Esto requiere usar la función de Supabase para crear usuarios
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

  -- Crear el registro de trainer
  INSERT INTO public.trainers (
    club_id,
    full_name,
    email,
    phone,
    specialty,
    photo_url,
    is_active
  ) VALUES (
    club_id,
    trainer_full_name,
    trainer_email,
    trainer_phone,
    trainer_specialty,
    trainer_photo_url,
    true
  ) RETURNING * INTO trainer_record;

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

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.create_trainer_user TO authenticated;

-- Política para permitir que los admins usen esta función
CREATE POLICY "Admins can create trainer users"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
