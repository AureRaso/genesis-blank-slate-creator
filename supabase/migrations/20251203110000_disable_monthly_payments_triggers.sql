-- Disable or remove any triggers/functions that reference class_id in monthly_payments
-- This is causing errors when creating class_participants

-- Drop any constraints that might be causing issues
DO $$
BEGIN
  -- Try to drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_payments_student_enrollment_id_class_id_month_year_key'
  ) THEN
    ALTER TABLE monthly_payments DROP CONSTRAINT monthly_payments_student_enrollment_id_class_id_month_year_key;
    RAISE NOTICE 'Dropped constraint monthly_payments_student_enrollment_id_class_id_month_year_key';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
END $$;

-- Remove class_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_payments' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE monthly_payments DROP COLUMN class_id CASCADE;
    RAISE NOTICE 'Dropped class_id column from monthly_payments';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop class_id column: %', SQLERRM;
END $$;

-- Comment
COMMENT ON TABLE monthly_payments IS 'Monthly payments for student enrollments - without class_id reference to avoid conflicts';
