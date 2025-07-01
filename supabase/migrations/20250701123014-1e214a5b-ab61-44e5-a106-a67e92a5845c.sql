
-- Create enum for class levels
CREATE TYPE public.class_level AS ENUM ('iniciacion', 'intermedio', 'avanzado');

-- Create enum for days of the week
CREATE TYPE public.day_of_week AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- Create enum for reservation status
CREATE TYPE public.reservation_status AS ENUM ('reservado', 'cancelado');

-- Create class_slots table
CREATE TABLE public.class_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  court_number INTEGER NOT NULL,
  trainer_name TEXT NOT NULL,
  objective TEXT NOT NULL,
  level class_level NOT NULL,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_per_player DECIMAL(10,2) NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 4,
  repeat_weekly BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_reservations table
CREATE TABLE public.class_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.class_slots(id) ON DELETE CASCADE,
  player_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status reservation_status NOT NULL DEFAULT 'reservado',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slot_id, player_profile_id) -- Prevent duplicate reservations
);

-- Enable RLS on class_slots
ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_slots
CREATE POLICY "Admins can view their own class slots" 
  ON public.class_slots 
  FOR SELECT 
  USING (created_by_profile_id = auth.uid());

CREATE POLICY "Players can view active class slots" 
  ON public.class_slots 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can create class slots" 
  ON public.class_slots 
  FOR INSERT 
  WITH CHECK (created_by_profile_id = auth.uid());

CREATE POLICY "Admins can update their own class slots" 
  ON public.class_slots 
  FOR UPDATE 
  USING (created_by_profile_id = auth.uid());

CREATE POLICY "Admins can delete their own class slots" 
  ON public.class_slots 
  FOR DELETE 
  USING (created_by_profile_id = auth.uid());

-- Enable RLS on class_reservations
ALTER TABLE public.class_reservations ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_reservations
CREATE POLICY "Users can view their own reservations" 
  ON public.class_reservations 
  FOR SELECT 
  USING (player_profile_id = auth.uid());

CREATE POLICY "Admins can view reservations for their class slots" 
  ON public.class_reservations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_slots 
      WHERE class_slots.id = class_reservations.slot_id 
      AND class_slots.created_by_profile_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own reservations" 
  ON public.class_reservations 
  FOR INSERT 
  WITH CHECK (player_profile_id = auth.uid());

CREATE POLICY "Players can update their own reservations" 
  ON public.class_reservations 
  FOR UPDATE 
  USING (player_profile_id = auth.uid());

CREATE POLICY "Admins can update reservations for their class slots" 
  ON public.class_reservations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_slots 
      WHERE class_slots.id = class_reservations.slot_id 
      AND class_slots.created_by_profile_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_class_slots_club_id ON public.class_slots(club_id);
CREATE INDEX idx_class_slots_created_by ON public.class_slots(created_by_profile_id);
CREATE INDEX idx_class_slots_active ON public.class_slots(is_active);
CREATE INDEX idx_class_reservations_slot_id ON public.class_reservations(slot_id);
CREATE INDEX idx_class_reservations_player_id ON public.class_reservations(player_profile_id);
