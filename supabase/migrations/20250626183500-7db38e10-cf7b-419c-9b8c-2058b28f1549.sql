
-- Añadir columnas para el nuevo sistema de creación y aprobación de partidos
ALTER TABLE matches 
ADD COLUMN created_by_player_id UUID REFERENCES players(id),
ADD COLUMN result_submitted_by_team_id UUID,
ADD COLUMN result_approved_by_team_id UUID,
ADD COLUMN result_status TEXT DEFAULT 'pending' CHECK (result_status IN ('pending', 'submitted', 'approved', 'disputed'));

-- Crear tabla para controlar la frecuencia de creación de partidos
CREATE TABLE player_match_creation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id),
  week_start DATE NOT NULL,
  matches_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, week_start)
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE player_match_creation ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean sus propios registros
CREATE POLICY "Players can view their own match creation records" 
  ON player_match_creation 
  FOR SELECT 
  USING (player_id IN (
    SELECT id FROM players WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  ));

-- Política para insertar registros
CREATE POLICY "Players can create their own match creation records" 
  ON player_match_creation 
  FOR INSERT 
  WITH CHECK (player_id IN (
    SELECT id FROM players WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  ));

-- Política para actualizar registros
CREATE POLICY "Players can update their own match creation records" 
  ON player_match_creation 
  FOR UPDATE 
  USING (player_id IN (
    SELECT id FROM players WHERE email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  ));

-- Función para verificar si un jugador puede crear un partido esta semana
CREATE OR REPLACE FUNCTION can_create_match_this_week(player_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  week_start DATE;
  matches_this_week INTEGER;
BEGIN
  -- Calcular el inicio de la semana (lunes)
  week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  
  -- Verificar cuántos partidos ha creado esta semana
  SELECT COALESCE(matches_created, 0) INTO matches_this_week
  FROM player_match_creation 
  WHERE player_match_creation.player_id = can_create_match_this_week.player_id 
    AND week_start = can_create_match_this_week.week_start;
  
  -- Retornar true si puede crear (menos de 1 partido esta semana)
  RETURN COALESCE(matches_this_week, 0) < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar la creación de un partido
CREATE OR REPLACE FUNCTION record_match_creation(player_id UUID)
RETURNS VOID AS $$
DECLARE
  week_start DATE;
BEGIN
  week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  
  INSERT INTO player_match_creation (player_id, week_start, matches_created)
  VALUES (player_id, week_start, 1)
  ON CONFLICT (player_id, week_start)
  DO UPDATE SET matches_created = player_match_creation.matches_created + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
