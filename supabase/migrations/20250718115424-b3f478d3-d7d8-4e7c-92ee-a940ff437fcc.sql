-- Create new tables for the redesigned class scheduling system

-- Create enum for recurrence types
CREATE TYPE public.recurrence_type AS ENUM ('weekly', 'biweekly', 'monthly');

-- Create enum for class status
CREATE TYPE public.class_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Create class_groups table for organizing students
CREATE TABLE public.class_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level class_level NOT NULL,
  description TEXT,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_templates table for reusable class configurations
CREATE TABLE public.class_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  group_id UUID REFERENCES public.class_groups(id) ON DELETE SET NULL,
  level class_level NOT NULL,
  trainer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_students INTEGER NOT NULL DEFAULT 8,
  price_per_student DECIMAL(10,2) NOT NULL DEFAULT 0,
  court_number INTEGER,
  objective TEXT,
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_schedules table for recurrence patterns
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.class_templates(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  recurrence_type recurrence_type NOT NULL DEFAULT 'weekly',
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_classes table for individual class instances
CREATE TABLE public.scheduled_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES public.class_schedules(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES public.class_templates(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  court_number INTEGER,
  max_students INTEGER NOT NULL,
  current_students INTEGER NOT NULL DEFAULT 0,
  status class_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_date, start_time, court_number, template_id)
);

-- Create class_enrollments table for student-class relationships
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_class_id UUID NOT NULL REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,
  student_enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status reservation_status NOT NULL DEFAULT 'reservado',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(scheduled_class_id, student_enrollment_id)
);

-- Create group_members table for student-group relationships
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.class_groups(id) ON DELETE CASCADE,
  student_enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, student_enrollment_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_groups
CREATE POLICY "Trainers can manage their club's groups" 
  ON public.class_groups 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clubs 
      WHERE trainer_clubs.trainer_profile_id = auth.uid() 
      AND trainer_clubs.club_id = class_groups.club_id
    )
  );

CREATE POLICY "Admins can manage groups in their clubs" 
  ON public.class_groups 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = class_groups.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- RLS policies for class_templates
CREATE POLICY "Trainers can manage their club's templates" 
  ON public.class_templates 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clubs 
      WHERE trainer_clubs.trainer_profile_id = auth.uid() 
      AND trainer_clubs.club_id = class_templates.club_id
    )
  );

CREATE POLICY "Admins can manage templates in their clubs" 
  ON public.class_templates 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE clubs.id = class_templates.club_id 
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- RLS policies for class_schedules
CREATE POLICY "Trainers can manage schedules they created" 
  ON public.class_schedules 
  FOR ALL 
  USING (created_by_profile_id = auth.uid());

CREATE POLICY "Admins can manage schedules in their clubs" 
  ON public.class_schedules 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_templates ct
      JOIN public.clubs c ON ct.club_id = c.id
      WHERE ct.id = class_schedules.template_id 
      AND c.created_by_profile_id = auth.uid()
    )
  );

-- RLS policies for scheduled_classes
CREATE POLICY "Trainers can view and manage their classes" 
  ON public.scheduled_classes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_templates ct
      WHERE ct.id = scheduled_classes.template_id 
      AND ct.trainer_profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage classes in their clubs" 
  ON public.scheduled_classes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_templates ct
      JOIN public.clubs c ON ct.club_id = c.id
      WHERE ct.id = scheduled_classes.template_id 
      AND c.created_by_profile_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their enrolled classes" 
  ON public.scheduled_classes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.student_enrollments se ON ce.student_enrollment_id = se.id
      WHERE ce.scheduled_class_id = scheduled_classes.id 
      AND se.created_by_profile_id = auth.uid()
    )
  );

-- RLS policies for class_enrollments
CREATE POLICY "Trainers can manage enrollments for their classes" 
  ON public.class_enrollments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_classes sc
      JOIN public.class_templates ct ON sc.template_id = ct.id
      WHERE sc.id = class_enrollments.scheduled_class_id 
      AND ct.trainer_profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all enrollments in their clubs" 
  ON public.class_enrollments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_classes sc
      JOIN public.class_templates ct ON sc.template_id = ct.id
      JOIN public.clubs c ON ct.club_id = c.id
      WHERE sc.id = class_enrollments.scheduled_class_id 
      AND c.created_by_profile_id = auth.uid()
    )
  );

-- RLS policies for group_members
CREATE POLICY "Trainers can manage their group members" 
  ON public.group_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_groups cg
      JOIN public.trainer_clubs tc ON cg.club_id = tc.club_id
      WHERE cg.id = group_members.group_id 
      AND tc.trainer_profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage group members in their clubs" 
  ON public.group_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.class_groups cg
      JOIN public.clubs c ON cg.club_id = c.id
      WHERE cg.id = group_members.group_id 
      AND c.created_by_profile_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_class_groups_club_id ON public.class_groups(club_id);
CREATE INDEX idx_class_templates_club_id ON public.class_templates(club_id);
CREATE INDEX idx_class_templates_trainer_id ON public.class_templates(trainer_profile_id);
CREATE INDEX idx_class_schedules_template_id ON public.class_schedules(template_id);
CREATE INDEX idx_scheduled_classes_date ON public.scheduled_classes(class_date);
CREATE INDEX idx_scheduled_classes_template_id ON public.scheduled_classes(template_id);
CREATE INDEX idx_class_enrollments_class_id ON public.class_enrollments(scheduled_class_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_class_groups_updated_at
  BEFORE UPDATE ON public.class_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_templates_updated_at
  BEFORE UPDATE ON public.class_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at
  BEFORE UPDATE ON public.class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_classes_updated_at
  BEFORE UPDATE ON public.scheduled_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_enrollments_updated_at
  BEFORE UPDATE ON public.class_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();