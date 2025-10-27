-- Fix RLS policies for student_enrollments to allow guardians to see their children's enrollments

-- First, let's see current policies on student_enrollments
-- Run this to inspect: SELECT * FROM pg_policies WHERE tablename = 'student_enrollments';

-- Drop existing policies that might be blocking guardians
DROP POLICY IF EXISTS "Guardians can view their children's enrollments" ON student_enrollments;

-- Create policy to allow guardians to view their children's enrollments
CREATE POLICY "Guardians can view their children's enrollments"
ON student_enrollments
FOR SELECT
USING (
  -- Allow if the student_profile_id belongs to one of the guardian's children
  student_profile_id IN (
    SELECT dependent_profile_id
    FROM account_dependents
    WHERE guardian_profile_id = auth.uid()
  )
  OR
  -- Allow if the email belongs to one of the guardian's children
  email IN (
    SELECT p.email
    FROM account_dependents ad
    JOIN profiles p ON p.id = ad.dependent_profile_id
    WHERE ad.guardian_profile_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'student_enrollments' AND policyname LIKE '%Guardian%';
