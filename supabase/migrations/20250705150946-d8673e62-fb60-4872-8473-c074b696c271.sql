
-- Agregar columna club_id a la tabla profiles para asociar jugadores con clubes
ALTER TABLE public.profiles 
ADD COLUMN club_id UUID REFERENCES public.clubs(id);

-- Crear índice para mejorar el rendimiento de las consultas por club
CREATE INDEX idx_profiles_club_id ON public.profiles(club_id);

-- Agregar columna status a la tabla clubs para poder filtrar clubes activos
ALTER TABLE public.clubs 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Actualizar los clubes existentes para que tengan status 'active'
UPDATE public.clubs SET status = 'active' WHERE status IS NULL;

-- Crear política RLS para que los jugadores solo vean contenido de su club
CREATE POLICY "Players can only view their club's leagues" 
  ON public.leagues 
  FOR SELECT 
  USING (
    club_id IS NULL OR 
    club_id IN (
      SELECT club_id FROM public.profiles 
      WHERE id = auth.uid() AND club_id IS NOT NULL
    )
  );

-- Política similar para class_slots
CREATE POLICY "Players can only view their club's class slots" 
  ON public.class_slots 
  FOR SELECT 
  USING (
    club_id IN (
      SELECT club_id FROM public.profiles 
      WHERE id = auth.uid() AND club_id IS NOT NULL
    )
  );
