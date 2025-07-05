
-- Limpiar la tabla trainers removiendo campos obsoletos que ya se manejan via profiles/trainer_clubs
ALTER TABLE public.trainers 
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS club_id,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS full_name;

-- Eliminar la función RPC problemática actual
DROP FUNCTION IF EXISTS public.create_trainer_user(text, text, uuid, text, text, text);

-- Crear una función RPC simple que solo maneja la parte de base de datos
CREATE OR REPLACE FUNCTION public.create_trainer_record(
  user_profile_id UUID,
  club_id UUID,
  trainer_specialty TEXT DEFAULT NULL,
  trainer_photo_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trainer_record RECORD;
BEGIN
  -- Crear registro en trainers
  INSERT INTO public.trainers (
    profile_id,
    specialty,
    photo_url,
    is_active
  ) VALUES (
    user_profile_id,
    trainer_specialty,
    trainer_photo_url,
    true
  ) RETURNING * INTO trainer_record;

  -- Crear relación trainer-club
  INSERT INTO public.trainer_clubs (
    trainer_profile_id,
    club_id
  ) VALUES (
    user_profile_id,
    club_id
  );

  RETURN json_build_object(
    'success', true,
    'trainer_id', trainer_record.id,
    'profile_id', user_profile_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;
