
-- Eliminar las políticas antiguas que hacían referencia al campo club_id que ya no existe
DROP POLICY IF EXISTS "Admins can create trainers for their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can delete trainers from their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can update trainers from their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can view trainers from their clubs" ON public.trainers;

-- Crear nuevas políticas para trainers usando la nueva estructura
CREATE POLICY "Admins can manage trainers" 
  ON public.trainers 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Trainers can view and update their own profile" 
  ON public.trainers 
  FOR ALL 
  USING (profile_id = auth.uid());

CREATE POLICY "Everyone can view active trainers" 
  ON public.trainers 
  FOR SELECT 
  USING (is_active = true);
