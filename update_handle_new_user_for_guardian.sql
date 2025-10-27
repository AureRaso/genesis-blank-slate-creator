-- ============================================
-- ACTUALIZAR handle_new_user para soportar rol guardian
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_role TEXT;
  user_club_id UUID;
  user_level DECIMAL(3,1);
BEGIN
  -- Obtener el rol del metadata (por defecto 'player' si no existe)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'player');

  -- Obtener club_id y level del metadata
  user_club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
  user_level := (NEW.raw_user_meta_data->>'level')::DECIMAL(3,1);

  -- Log para debug
  RAISE LOG 'handle_new_user - Creating profile for user % with role %', NEW.email, user_role;

  -- Insertar el perfil con el rol correspondiente
  INSERT INTO public.profiles (id, email, full_name, role, club_id, level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    user_role,  -- Usar el rol del metadata
    user_club_id,
    user_level
  );

  RETURN NEW;
END;
$$;

-- Verificar que la función se actualizó correctamente
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT '✅ Función handle_new_user actualizada para soportar rol guardian!' as status;
