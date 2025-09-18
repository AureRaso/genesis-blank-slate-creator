-- Add monthly payment tracking fields to class_participants
ALTER TABLE class_participants 
ADD COLUMN total_months integer,
ADD COLUMN months_paid integer[] DEFAULT '{}',
ADD COLUMN payment_type text DEFAULT 'monthly' CHECK (payment_type IN ('monthly', 'full')),
ADD COLUMN total_amount_due numeric DEFAULT 0,
ADD COLUMN amount_paid numeric DEFAULT 0;

-- Update existing records to set reasonable defaults
UPDATE class_participants 
SET total_months = 1,
    months_paid = CASE 
      WHEN payment_status = 'paid' THEN ARRAY[1]
      ELSE '{}'::integer[]
    END,
    payment_type = 'monthly',
    total_amount_due = (
      SELECT pc.monthly_price 
      FROM programmed_classes pc 
      WHERE pc.id = class_participants.class_id
    ),
    amount_paid = CASE 
      WHEN payment_status = 'paid' THEN (
        SELECT pc.monthly_price 
        FROM programmed_classes pc 
        WHERE pc.id = class_participants.class_id
      )
      ELSE 0
    END;