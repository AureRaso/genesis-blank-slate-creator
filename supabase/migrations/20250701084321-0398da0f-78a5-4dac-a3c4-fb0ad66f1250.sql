
-- Crear tabla para almacenar los clubs
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  court_count INTEGER NOT NULL CHECK (court_count > 0),
  court_types TEXT[] NOT NULL,
  description TEXT,
  created_by_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir restricción para evitar duplicados por nombre y dirección para el mismo administrador
ALTER TABLE public.clubs 
ADD CONSTRAINT unique_club_per_admin UNIQUE (name, address, created_by_profile_id);

-- Añadir restricción para validar la descripción
ALTER TABLE public.clubs 
ADD CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 200);

-- Habilitar RLS para clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores solo vean sus propios clubs
CREATE POLICY "Admins can view their own clubs" 
  ON public.clubs 
  FOR SELECT 
  USING (created_by_profile_id = auth.uid());

-- Política para que los administradores puedan crear clubs
CREATE POLICY "Admins can create clubs" 
  ON public.clubs 
  FOR INSERT 
  WITH CHECK (created_by_profile_id = auth.uid());

-- Política para que los administradores puedan actualizar sus clubs
CREATE POLICY "Admins can update their own clubs" 
  ON public.clubs 
  FOR UPDATE 
  USING (created_by_profile_id = auth.uid());

-- Política para que los administradores puedan eliminar sus clubs
CREATE POLICY "Admins can delete their own clubs" 
  ON public.clubs 
  FOR DELETE 
  USING (created_by_profile_id = auth.uid());

-- Añadir campo club_id a la tabla leagues
ALTER TABLE public.leagues 
ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;

-- Añadir índice para mejorar las consultas
CREATE INDEX idx_clubs_created_by_profile_id ON public.clubs(created_by_profile_id);
CREATE INDEX idx_leagues_club_id ON public.leagues(club_id);
