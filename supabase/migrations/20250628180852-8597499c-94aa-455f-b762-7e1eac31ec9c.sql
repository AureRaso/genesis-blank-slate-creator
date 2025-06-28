
-- Corregir la función can_create_match_this_week para manejar correctamente cuando no hay registros
CREATE OR REPLACE FUNCTION can_create_match_this_week(_profile_id UUID)
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
  WHERE profile_id = _profile_id 
    AND week_start = current_week_start;
  
  -- Si no hay registro, matches_this_week será NULL, así que usar COALESCE para convertir a 0
  -- Retornar true si puede crear (menos de 1 partido esta semana)
  RETURN COALESCE(matches_this_week, 0) < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
