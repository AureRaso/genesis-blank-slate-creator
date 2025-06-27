
-- 1. Eliminar las funciones existentes que usan player_id
DROP FUNCTION IF EXISTS can_create_match_this_week(uuid);
DROP FUNCTION IF EXISTS record_match_creation(uuid);

-- 2. Crear una vista para jugadores públicos (perfiles con rol 'player')
CREATE OR REPLACE VIEW public.public_players AS
SELECT 
  id,
  email,
  full_name as name,
  created_at
FROM public.profiles 
WHERE role = 'player';

-- 3. Agregar columna de nivel a profiles para reemplazar players.level
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level INTEGER CHECK (level >= 1 AND level <= 5) DEFAULT 3;

-- 4. Eliminar políticas RLS que dependen de player_id ANTES de eliminar las columnas
DROP POLICY IF EXISTS "Players can view their own match creation records" ON public.player_match_creation;
DROP POLICY IF EXISTS "Players can create their own match creation records" ON public.player_match_creation;
DROP POLICY IF EXISTS "Players can update their own match creation records" ON public.player_match_creation;

-- 5. Actualizar league_players para usar profile_id en lugar de player_id
ALTER TABLE public.league_players 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Migrar datos existentes de player_id a profile_id si existen
UPDATE public.league_players 
SET profile_id = (
  SELECT p.id 
  FROM public.profiles p 
  JOIN public.players pl ON pl.email = p.email 
  WHERE pl.id = league_players.player_id
)
WHERE player_id IS NOT NULL AND profile_id IS NULL;

-- 6. Actualizar player_match_creation para usar profile_id
ALTER TABLE public.player_match_creation 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Migrar datos existentes
UPDATE public.player_match_creation 
SET profile_id = (
  SELECT p.id 
  FROM public.profiles p 
  JOIN public.players pl ON pl.email = p.email 
  WHERE pl.id = player_match_creation.player_id
)
WHERE player_id IS NOT NULL AND profile_id IS NULL;

-- 7. Actualizar matches para usar profile_id en lugar de created_by_player_id
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS created_by_profile_id UUID REFERENCES public.profiles(id);

-- Migrar datos existentes
UPDATE public.matches 
SET created_by_profile_id = (
  SELECT p.id 
  FROM public.profiles p 
  JOIN public.players pl ON pl.email = p.email 
  WHERE pl.id = matches.created_by_player_id
)
WHERE created_by_player_id IS NOT NULL AND created_by_profile_id IS NULL;

-- 8. Ahora eliminar las columnas player_id (usando CASCADE para eliminar dependencias)
ALTER TABLE public.league_players DROP COLUMN IF EXISTS player_id CASCADE;
ALTER TABLE public.player_match_creation DROP COLUMN IF EXISTS player_id CASCADE;
ALTER TABLE public.matches DROP COLUMN IF EXISTS created_by_player_id CASCADE;

-- 9. Hacer profile_id NOT NULL después de la migración
ALTER TABLE public.league_players ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.player_match_creation ALTER COLUMN profile_id SET NOT NULL;

-- 10. Crear las nuevas funciones SQL para usar profile_id
CREATE OR REPLACE FUNCTION can_create_match_this_week(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_week_start DATE;
  matches_this_week INTEGER;
BEGIN
  -- Calcular el inicio de la semana (lunes)
  current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  
  -- Verificar cuántos partidos ha creado esta semana
  SELECT COALESCE(matches_created, 0) INTO matches_this_week
  FROM player_match_creation 
  WHERE player_match_creation.profile_id = can_create_match_this_week.profile_id 
    AND player_match_creation.week_start = current_week_start;
  
  -- Retornar true si puede crear (menos de 1 partido esta semana)
  RETURN COALESCE(matches_this_week, 0) < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_match_creation(profile_id UUID)
RETURNS VOID AS $$
DECLARE
  current_week_start DATE;
BEGIN
  current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  
  INSERT INTO player_match_creation (profile_id, week_start, matches_created)
  VALUES (profile_id, current_week_start, 1)
  ON CONFLICT (profile_id, week_start)
  DO UPDATE SET matches_created = player_match_creation.matches_created + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Crear nuevas políticas RLS para league_players
DROP POLICY IF EXISTS "Authenticated users can view league players" ON public.league_players;
DROP POLICY IF EXISTS "Authenticated users can register for leagues" ON public.league_players;
DROP POLICY IF EXISTS "Only admins can update league players" ON public.league_players;
DROP POLICY IF EXISTS "Users can withdraw from leagues they registered for" ON public.league_players;

CREATE POLICY "Authenticated users can view league players" ON public.league_players
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can register for leagues" ON public.league_players
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Only admins can update league players" ON public.league_players
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can withdraw from leagues they registered for" ON public.league_players
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- 12. Crear nuevas políticas RLS para player_match_creation
CREATE POLICY "Users can view their own match creation records" ON public.player_match_creation
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own match creation records" ON public.player_match_creation
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own match creation records" ON public.player_match_creation
  FOR UPDATE USING (profile_id = auth.uid());

-- 13. Finalmente, eliminar la tabla players después de migrar todos los datos
DROP TABLE IF EXISTS public.players CASCADE;

-- 14. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_league_players_profile_id ON public.league_players(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_match_creation_profile_id ON public.player_match_creation(profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_by_profile ON public.matches(created_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
