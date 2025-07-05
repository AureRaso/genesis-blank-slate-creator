
-- Añadir política para que cualquier usuario pueda ver clubes activos
CREATE POLICY "Anyone can view active clubs for registration" 
  ON public.clubs 
  FOR SELECT 
  USING (status = 'active');
