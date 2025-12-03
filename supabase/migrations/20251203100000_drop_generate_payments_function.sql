-- Drop the problematic generate_monthly_payments_for_participant function
-- This function was trying to use a column 'class_id' in monthly_payments that doesn't exist

DROP FUNCTION IF EXISTS generate_monthly_payments_for_participant(UUID);
DROP FUNCTION IF EXISTS generate_monthly_payments_for_participant();
