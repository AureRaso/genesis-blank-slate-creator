
-- Actualizar el enum de roles para incluir 'trainer'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainer';

-- Actualizar la columna role en profiles para usar el enum (si no lo está usando ya)
-- Primero verificamos si la columna ya usa el enum
DO $$
BEGIN
    -- Si la columna no usa el enum, la actualizamos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Crear el enum si no existe
        DO $create_enum$
        BEGIN
            CREATE TYPE public.app_role AS ENUM ('admin', 'player', 'captain', 'trainer');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END
        $create_enum$;
        
        -- Actualizar la columna para usar el enum
        ALTER TABLE public.profiles 
        ALTER COLUMN role TYPE public.app_role 
        USING role::public.app_role;
    END IF;
END
$$;

-- Crear tabla de relación trainer_clubs para asociar profesores con clubs
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

-- Actualizar la tabla trainers para referenciar profiles en lugar de solo datos básicos
-- Primero eliminar la tabla trainers existente si existe
DROP TABLE IF EXISTS public.trainers CASCADE;

-- Crear nueva tabla trainers que referencia profiles
CREATE TABLE public.trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  specialty TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Políticas para trainers
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

-- Actualizar class_slots para usar la nueva estructura de trainers
ALTER TABLE public.class_slots 
DROP CONSTRAINT IF EXISTS class_slots_trainer_id_fkey;

ALTER TABLE public.class_slots 
ADD CONSTRAINT class_slots_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES public.trainers(id);

-- Trigger para updated_at en trainers
CREATE TRIGGER update_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para verificar si un usuario es trainer
CREATE OR REPLACE FUNCTION public.is_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = _user_id;

  RETURN user_role = 'trainer';
END;
$function$;
