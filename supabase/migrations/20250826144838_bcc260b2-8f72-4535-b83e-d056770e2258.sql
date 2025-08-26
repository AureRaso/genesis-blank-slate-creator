-- Add monthly_price field to programmed_classes table
ALTER TABLE public.programmed_classes 
ADD COLUMN monthly_price NUMERIC DEFAULT 0.00 NOT NULL;