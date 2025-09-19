-- Add monthly payment tracking fields to class_participants (step by step to avoid trigger timeout)
ALTER TABLE class_participants 
ADD COLUMN IF NOT EXISTS total_months integer,
ADD COLUMN IF NOT EXISTS months_paid integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS total_amount_due numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;

-- Add constraint for payment_type after column creation
ALTER TABLE class_participants 
ADD CONSTRAINT payment_type_check CHECK (payment_type IN ('monthly', 'full'));