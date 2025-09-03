-- Add payment fields to class_participants table
ALTER TABLE public.class_participants 
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN payment_method text,
ADD COLUMN payment_date timestamp with time zone,
ADD COLUMN payment_verified boolean NOT NULL DEFAULT false,
ADD COLUMN payment_notes text;

-- Add check constraint for payment_status
ALTER TABLE public.class_participants 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'verified'));

-- Add check constraint for payment_method
ALTER TABLE public.class_participants 
ADD CONSTRAINT check_payment_method 
CHECK (payment_method IN ('efectivo', 'tarjeta') OR payment_method IS NULL);

-- Create index for payment queries
CREATE INDEX idx_class_participants_payment_status ON public.class_participants(payment_status);
CREATE INDEX idx_class_participants_payment_date ON public.class_participants(payment_date);