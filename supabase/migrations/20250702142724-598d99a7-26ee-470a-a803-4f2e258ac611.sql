-- Crear tabla para profesores/entrenadores
CREATE TABLE public.trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  specialty TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Políticas para que los administradores gestionen sus propios entrenadores
CREATE POLICY "Admins can view trainers from their clubs" 
  ON public.trainers 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = trainers.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create trainers for their clubs" 
  ON public.trainers 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = trainers.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update trainers from their clubs" 
  ON public.trainers 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = trainers.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete trainers from their clubs" 
  ON public.trainers 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = trainers.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- Agregar columna trainer_id a class_slots y hacer foreign key
ALTER TABLE public.class_slots 
ADD COLUMN trainer_id UUID REFERENCES public.trainers(id);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();