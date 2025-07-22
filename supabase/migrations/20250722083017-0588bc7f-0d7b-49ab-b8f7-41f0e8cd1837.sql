
-- Drop existing problematic tables and create new clean structure
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS scheduled_classes CASCADE;
DROP TABLE IF EXISTS class_templates CASCADE;

-- Create the main programmed classes table
CREATE TABLE public.programmed_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level_from DECIMAL(3,1) CHECK (level_from >= 1.0 AND level_from <= 10.0),
  level_to DECIMAL(3,1) CHECK (level_to >= 1.0 AND level_to <= 10.0),
  custom_level TEXT CHECK (custom_level IN ('primera_alta', 'primera_media', 'primera_baja', 'segunda_alta', 'segunda_media', 'segunda_baja', 'tercera_alta', 'tercera_media', 'tercera_baja')),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  start_time TIME NOT NULL,
  days_of_week TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  recurrence_type TEXT NOT NULL DEFAULT 'weekly',
  trainer_profile_id UUID NOT NULL REFERENCES profiles(id),
  club_id UUID NOT NULL REFERENCES clubs(id),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Ensure either numeric levels or custom level is used, not both
  CONSTRAINT check_level_format CHECK (
    (level_from IS NOT NULL AND level_to IS NOT NULL AND custom_level IS NULL) OR
    (level_from IS NULL AND level_to IS NULL AND custom_level IS NOT NULL)
  ),
  
  -- Ensure level_from <= level_to when using numeric levels
  CONSTRAINT check_level_range CHECK (
    (level_from IS NULL OR level_to IS NULL) OR (level_from <= level_to)
  )
);

-- Create the class participants table
CREATE TABLE public.class_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'inactive')),
  discount_1 DECIMAL(5,2),
  discount_2 DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique student per class
  CONSTRAINT unique_student_per_class UNIQUE (class_id, student_profile_id)
);

-- Enable RLS
ALTER TABLE public.programmed_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_participants ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is trainer of club
CREATE OR REPLACE FUNCTION public.is_trainer_of_club_safe(club_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trainer_clubs 
    WHERE trainer_clubs.club_id = is_trainer_of_club_safe.club_id 
    AND trainer_clubs.trainer_profile_id = auth.uid()
  );
END;
$$;

-- RLS Policies for programmed_classes
CREATE POLICY "Trainers can manage their classes" ON public.programmed_classes
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Trainers can view classes in their clubs" ON public.programmed_classes
  FOR SELECT USING (is_trainer_of_club_safe(club_id));

CREATE POLICY "Club admins can manage classes in their clubs" ON public.programmed_classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = programmed_classes.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- RLS Policies for class_participants
CREATE POLICY "Trainers can manage participants in their classes" ON public.class_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_participants.class_id 
      AND pc.created_by = auth.uid()
    )
  );

CREATE POLICY "Club admins can manage participants in their club classes" ON public.class_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      JOIN clubs c ON c.id = pc.club_id
      WHERE pc.id = class_participants.class_id 
      AND c.created_by_profile_id = auth.uid()
    )
  );

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER programmed_classes_updated_at
  BEFORE UPDATE ON public.programmed_classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER class_participants_updated_at
  BEFORE UPDATE ON public.class_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
