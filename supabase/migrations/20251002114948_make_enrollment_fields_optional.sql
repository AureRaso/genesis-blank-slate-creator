-- Make enrollment fields optional in student_enrollments table
ALTER TABLE student_enrollments
ALTER COLUMN weekly_days DROP NOT NULL,
ALTER COLUMN preferred_times DROP NOT NULL,
ALTER COLUMN enrollment_period DROP NOT NULL;

-- Set default values for existing null records if any
UPDATE student_enrollments
SET
  weekly_days = '{}'
WHERE weekly_days IS NULL;

UPDATE student_enrollments
SET
  preferred_times = '{}'
WHERE preferred_times IS NULL;

UPDATE student_enrollments
SET
  enrollment_period = 'mensual'
WHERE enrollment_period IS NULL;

-- Fix RLS policy to allow students to insert their own enrollments
-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Students can create their own enrollments" ON student_enrollments;

-- Create a new policy that allows authenticated users to insert enrollment records
-- where they are the created_by_profile_id
CREATE POLICY "Students can create their own enrollments" ON student_enrollments
    FOR INSERT
    WITH CHECK (auth.uid() = created_by_profile_id);