
-- Primero eliminar todas las políticas RLS que referencian club_id
DROP POLICY IF EXISTS "Admins can create trainers for their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can delete trainers from their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can update trainers from their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can view trainers from their clubs" ON public.trainers;

-- Eliminar cualquier foreign key constraint que pueda existir
ALTER TABLE public.trainers DROP CONSTRAINT IF EXISTS trainers_club_id_fkey;

-- Ahora eliminar la columna club_id
ALTER TABLE public.trainers DROP COLUMN IF EXISTS club_id;

-- También eliminar otros campos redundantes
ALTER TABLE public.trainers DROP COLUMN IF EXISTS email;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS phone;

-- Crear las nuevas políticas RLS sin referencia a club_id
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
