-- Check the structure of monthly_payments table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'monthly_payments'
ORDER BY ordinal_position;
