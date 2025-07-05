
-- Agregar política RLS para permitir a los profesores ver los clubs a los que están asignados
CREATE POLICY "Trainers can view their assigned clubs" 
  ON public.clubs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clubs 
      WHERE trainer_clubs.club_id = clubs.id 
      AND trainer_clubs.trainer_profile_id = auth.uid()
    )
  );
