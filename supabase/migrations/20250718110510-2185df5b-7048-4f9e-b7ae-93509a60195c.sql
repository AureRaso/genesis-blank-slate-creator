-- Create table for student enrollments
CREATE TABLE public.student_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_profile_id UUID NOT NULL,
  club_id UUID NOT NULL,
  created_by_profile_id UUID NOT NULL,
  
  -- Personal data
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  level DECIMAL(3,1) NOT NULL CHECK (level >= 1.0 AND level <= 10.0),
  
  -- Schedule and enrollment
  weekly_days TEXT[] NOT NULL,
  preferred_times TEXT[] NOT NULL,
  enrollment_period TEXT NOT NULL CHECK (enrollment_period IN ('mensual', 'bimensual', 'trimestral', 'semestral', 'anual')),
  
  -- Teacher-only fields
  enrollment_date DATE,
  expected_end_date DATE,
  course TEXT,
  discount_1 DECIMAL(10,2),
  discount_2 DECIMAL(10,2),
  first_payment DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'bizum')),
  observations TEXT,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for enrollment forms/tokens
CREATE TABLE public.enrollment_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  trainer_profile_id UUID NOT NULL,
  club_id UUID NOT NULL,
  
  -- Form data
  student_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_forms ENABLE ROW LEVEL SECURITY;

-- Create policies for student_enrollments
CREATE POLICY "Trainers can manage their students"
ON public.student_enrollments
FOR ALL
USING (trainer_profile_id = auth.uid());

CREATE POLICY "Admins can view all student enrollments"
ON public.student_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for enrollment_forms
CREATE POLICY "Trainers can manage their enrollment forms"
ON public.enrollment_forms
FOR ALL
USING (trainer_profile_id = auth.uid());

CREATE POLICY "Public can view valid enrollment forms"
ON public.enrollment_forms
FOR SELECT
USING (
  status = 'pending' AND 
  expires_at > now()
);

CREATE POLICY "Public can update enrollment forms"
ON public.enrollment_forms
FOR UPDATE
USING (
  status = 'pending' AND 
  expires_at > now()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_student_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_enrollment_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_student_enrollments_updated_at
BEFORE UPDATE ON public.student_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_student_enrollments_updated_at();

CREATE TRIGGER update_enrollment_forms_updated_at
BEFORE UPDATE ON public.enrollment_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_enrollment_forms_updated_at();

-- Add foreign key constraints
ALTER TABLE public.student_enrollments
ADD CONSTRAINT student_enrollments_trainer_profile_id_fkey
FOREIGN KEY (trainer_profile_id) REFERENCES public.profiles(id);

ALTER TABLE public.student_enrollments
ADD CONSTRAINT student_enrollments_club_id_fkey
FOREIGN KEY (club_id) REFERENCES public.clubs(id);

ALTER TABLE public.student_enrollments
ADD CONSTRAINT student_enrollments_created_by_profile_id_fkey
FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id);

ALTER TABLE public.enrollment_forms
ADD CONSTRAINT enrollment_forms_trainer_profile_id_fkey
FOREIGN KEY (trainer_profile_id) REFERENCES public.profiles(id);

ALTER TABLE public.enrollment_forms
ADD CONSTRAINT enrollment_forms_club_id_fkey
FOREIGN KEY (club_id) REFERENCES public.clubs(id);