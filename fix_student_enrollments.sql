-- SCRIPT PARA APLICAR MANUALMENTE EN SUPABASE SQL EDITOR
-- Copia este contenido y ejecutalo en el SQL Editor de Supabase Dashboard

-- 1. Make enrollment fields optional in student_enrollments table
ALTER TABLE student_enrollments
ALTER COLUMN weekly_days DROP NOT NULL,
ALTER COLUMN preferred_times DROP NOT NULL,
ALTER COLUMN enrollment_period DROP NOT NULL;

-- 2. Set default values for existing null records if any
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

-- 3. Fix RLS policies to allow both authenticated and public enrollments
-- First, drop existing policies
DROP POLICY IF EXISTS "Students can create their own enrollments" ON student_enrollments;
DROP POLICY IF EXISTS "Public enrollment via tokens" ON student_enrollments;

-- Policy for authenticated users (teachers/admins creating enrollments)
CREATE POLICY "Authenticated users can create enrollments" ON student_enrollments
    FOR INSERT
    WITH CHECK (auth.uid() = created_by_profile_id);

-- Policy for public enrollments via tokens (non-authenticated users)
-- Allow inserts where created_by_profile_id is a valid trainer_profile_id
CREATE POLICY "Public enrollment via tokens" ON student_enrollments
    FOR INSERT
    WITH CHECK (
        created_by_profile_id IN (
            SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
        )
    );

-- 4. Verify the changes
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
    AND column_name IN ('weekly_days', 'preferred_times', 'enrollment_period');

-- 5. Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'student_enrollments';