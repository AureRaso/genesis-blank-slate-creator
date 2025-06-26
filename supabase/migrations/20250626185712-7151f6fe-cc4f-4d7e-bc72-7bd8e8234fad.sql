
-- Corregir la función para resolver la ambigüedad de week_start
CREATE OR REPLACE FUNCTION can_create_match_this_week(player_id UUID)
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
  WHERE player_match_creation.player_id = can_create_match_this_week.player_id 
    AND player_match_creation.week_start = current_week_start;
  
  -- Retornar true si puede crear (menos de 1 partido esta semana)
  RETURN COALESCE(matches_this_week, 0) < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- También corregir la función record_match_creation para consistencia
CREATE OR REPLACE FUNCTION record_match_creation(player_id UUID)
RETURNS VOID AS $$
DECLARE
  current_week_start DATE;
BEGIN
  current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  
  INSERT INTO player_match_creation (player_id, week_start, matches_created)
  VALUES (player_id, current_week_start, 1)
  ON CONFLICT (player_id, week_start)
  DO UPDATE SET matches_created = player_match_creation.matches_created + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
