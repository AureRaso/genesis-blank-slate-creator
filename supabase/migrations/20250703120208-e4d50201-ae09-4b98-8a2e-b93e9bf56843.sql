
-- Actualizar la tabla trainers para usar profile_id en lugar de datos redundantes
ALTER TABLE public.trainers DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS email;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS phone;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS club_id;

-- Agregar profile_id a trainers si no existe
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Hacer profile_id único para evitar duplicados
ALTER TABLE public.trainers ADD CONSTRAINT trainers_profile_id_unique UNIQUE (profile_id);

-- Crear la tabla trainer_clubs si no existe
CREATE TABLE IF NOT EXISTS public.trainer_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_profile_id, club_id)
);

-- Habilitar RLS en trainer_clubs
ALTER TABLE public.trainer_clubs ENABLE ROW LEVEL SECURITY;

-- Políticas para trainer_clubs
CREATE POLICY "Admins can manage trainer clubs for their clubs" 
  ON public.trainer_clubs 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = trainer_clubs.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can view their assigned clubs" 
  ON public.trainer_clubs 
  FOR SELECT 
  USING (trainer_profile_id = auth.uid());

-- Actualizar las políticas RLS de trainers para usar la nueva estructura
DROP POLICY IF EXISTS "Admins can create trainers for their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can delete trainers from their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can update trainers from their clubs" ON public.trainers;
DROP POLICY IF EXISTS "Admins can view trainers from their clubs" ON public.trainers;

-- Nuevas políticas para trainers
CREATE POLICY "Everyone can view active trainers" 
  ON public.trainers 
  FOR SELECT 
  USING (is_active = true);

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
