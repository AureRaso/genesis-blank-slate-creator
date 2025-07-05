
-- Actualizar el trigger para incluir club_id desde los metadatos del usuario
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, club_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    'player',
    NEW.raw_user_meta_data ->> 'club_id'
  );
  RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Mejorar las políticas RLS para asegurar que solo ven contenido de su club
DROP POLICY IF EXISTS "Players can only view their club's leagues" ON public.leagues;
CREATE POLICY "Players can only view their club's leagues" 
  ON public.leagues 
  FOR SELECT 
  USING (
    -- Los admins pueden ver todas las ligas
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    -- Las ligas sin club asignado son públicas
    club_id IS NULL OR 
    -- Los jugadores solo ven ligas de su club
    club_id IN (
      SELECT club_id FROM public.profiles 
      WHERE id = auth.uid() AND club_id IS NOT NULL
    )
  );

-- Política similar para class_slots con mejoras
DROP POLICY IF EXISTS "Players can only view their club's class slots" ON public.class_slots;
CREATE POLICY "Players can only view their club's class slots" 
  ON public.class_slots 
  FOR SELECT 
  USING (
    -- Los admins pueden ver todas las clases
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    -- Los jugadores solo ven clases de su club
    club_id IN (
      SELECT club_id FROM public.profiles 
      WHERE id = auth.uid() AND club_id IS NOT NULL
    )
  );

-- Política para que los jugadores solo vean entrenadores de su club
DROP POLICY IF EXISTS "Players can view trainers from their club" ON public.trainers;
CREATE POLICY "Players can view trainers from their club" 
  ON public.trainers 
  FOR SELECT 
  USING (
    is_active = true AND (
      -- Los admins pueden ver todos los entrenadores
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
      -- Los jugadores solo ven entrenadores de su club
      EXISTS (
        SELECT 1 FROM public.trainer_clubs tc
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE tc.trainer_profile_id = trainers.profile_id 
        AND tc.club_id = p.club_id
        AND p.club_id IS NOT NULL
      )
    )
  );
