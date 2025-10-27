-- NUCLEAR OPTION: Drop ALL policies and recreate from scratch without recursion

-- ========================================
-- 1. DROP ALL POLICIES ON account_dependents
-- ========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'account_dependents')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON account_dependents';
    END LOOP;
END $$;

-- Create ONLY guardian policy - simple and non-recursive
CREATE POLICY "account_dependents_guardian_all"
ON account_dependents
FOR ALL
USING (guardian_profile_id = auth.uid())
WITH CHECK (guardian_profile_id = auth.uid());

-- ========================================
-- 2. DROP ALL POLICIES ON student_enrollments
-- ========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'student_enrollments')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON student_enrollments';
    END LOOP;
END $$;

-- Create policies for student_enrollments - each role gets its own simple policy

-- 1. Admin/Owner can see all
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

-- 2. Trainers can see enrollments in their clubs
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

-- 3. Players can see their own enrollments
CREATE POLICY "student_enrollments_player_select"
ON student_enrollments
FOR SELECT
USING (
  student_profile_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 4. Guardians can see their children's enrollments
CREATE POLICY "student_enrollments_guardian_select"
ON student_enrollments
FOR SELECT
USING (
  student_profile_id IN (
    SELECT dependent_profile_id
    FROM account_dependents
    WHERE guardian_profile_id = auth.uid()
  )
);

-- ========================================
-- 3. Verify policies were created
-- ========================================
SELECT 'account_dependents policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'account_dependents';

SELECT 'student_enrollments policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_enrollments';
