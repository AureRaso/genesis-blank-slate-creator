
-- Primero eliminar la política problemática que causa recursión infinita
DROP POLICY IF EXISTS "Trainers can view their assigned clubs" ON public.clubs;

-- Crear función de seguridad para verificar si un profesor está asignado a un club
CREATE OR REPLACE FUNCTION public.is_trainer_assigned_to_club(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trainer_clubs 
    WHERE trainer_clubs.club_id = is_trainer_assigned_to_club.club_id 
    AND trainer_clubs.trainer_profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Crear nueva política usando la función de seguridad
CREATE POLICY "Trainers can view their assigned clubs" 
  ON public.clubs 
  FOR SELECT 
  USING (public.is_trainer_assigned_to_club(id));
