-- Fix all RLS recursion issues for guardian system

-- ========================================
-- 1. Fix account_dependents policies
-- ========================================

-- Drop all existing policies on account_dependents
DROP POLICY IF EXISTS "Guardians can view their children" ON account_dependents;
DROP POLICY IF EXISTS "Guardians can insert their children" ON account_dependents;
DROP POLICY IF EXISTS "Guardians can update their children" ON account_dependents;
DROP POLICY IF EXISTS "Guardians can delete their children" ON account_dependents;
DROP POLICY IF EXISTS "Guardians can manage their dependents" ON account_dependents;
DROP POLICY IF EXISTS "Guardians can view their children's enrollments" ON student_enrollments;

-- Create simple, non-recursive policies for account_dependents
CREATE POLICY "Guardians can manage their dependents"
ON account_dependents
FOR ALL
USING (guardian_profile_id = auth.uid())
WITH CHECK (guardian_profile_id = auth.uid());

-- ========================================
-- 2. Fix student_enrollments policies
-- ========================================

-- First, let's see what policies exist
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_enrollments';

-- Drop the problematic guardian policy
DROP POLICY IF EXISTS "Guardians can view their children's enrollments" ON student_enrollments;

-- Create a simple policy that doesn't cause recursion
-- Instead of joining through account_dependents, we'll use a simpler approach
CREATE POLICY "student_enrollments_guardian_select"
ON student_enrollments
FOR SELECT
USING (
  -- Allow if student_profile_id matches a dependent
  EXISTS (
    SELECT 1 FROM account_dependents
    WHERE account_dependents.dependent_profile_id = student_enrollments.student_profile_id
      AND account_dependents.guardian_profile_id = auth.uid()
  )
);

-- Also ensure admins can still see all enrollments
DROP POLICY IF EXISTS "student_enrollments_admin_all" ON student_enrollments;
CREATE POLICY "student_enrollments_admin_all"
ON student_enrollments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
  )
);

-- Ensure trainers can see enrollments in their clubs
DROP POLICY IF EXISTS "student_enrollments_trainer_select" ON student_enrollments;
CREATE POLICY "student_enrollments_trainer_select"
ON student_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clubs
    WHERE trainer_clubs.trainer_profile_id = auth.uid()
      AND trainer_clubs.club_id = student_enrollments.club_id
  )
);

-- Ensure players can see their own enrollments
DROP POLICY IF EXISTS "student_enrollments_player_select" ON student_enrollments;
CREATE POLICY "student_enrollments_player_select"
ON student_enrollments
FOR SELECT
USING (
  student_profile_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
