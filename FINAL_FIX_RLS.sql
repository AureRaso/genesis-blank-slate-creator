-- ============================================================================
-- FINAL FIX: Complete RLS rebuild for programmed_classes and class_participants
-- This fixes the infinite recursion error completely
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: Fix class_participants table and policies
-- ============================================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE public.class_participants DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'class_participants' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_participants', r.policyname);
    END LOOP;
END $$;

-- Step 3: Drop old function if exists
DROP FUNCTION IF EXISTS public.is_my_enrollment(UUID);

-- Step 4: Add attendance fields if missing
ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS attendance_confirmed_for_date DATE,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_class_participants_attendance_date
ON class_participants(attendance_confirmed_for_date)
WHERE attendance_confirmed_for_date IS NOT NULL;

-- Step 5: Create safe SECURITY DEFINER function
-- This function bypasses RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.is_my_enrollment(enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM student_enrollments se
    JOIN profiles p ON p.email = se.email
    WHERE se.id = enrollment_id
    AND p.id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_enrollment(UUID) TO authenticated;

-- Step 6: Re-enable RLS
ALTER TABLE public.class_participants ENABLE ROW LEVEL SECURITY;

-- Step 7: Create clean, simple policies for class_participants
CREATE POLICY "players_view_own_participations"
ON public.class_participants
FOR SELECT
TO authenticated
USING (is_my_enrollment(student_enrollment_id));

CREATE POLICY "players_update_own_attendance"
ON public.class_participants
FOR UPDATE
TO authenticated
USING (is_my_enrollment(student_enrollment_id))
WITH CHECK (is_my_enrollment(student_enrollment_id));

CREATE POLICY "trainers_manage_own_class_participants"
ON public.class_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM programmed_classes pc
    WHERE pc.id = class_participants.class_id
    AND pc.created_by = auth.uid()
  )
);

CREATE POLICY "club_admins_manage_all_participants"
ON public.class_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM programmed_classes pc
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.id = class_participants.class_id
    AND c.created_by_profile_id = auth.uid()
  )
);

-- ============================================================================
-- PART 2: Fix programmed_classes policies to AVOID recursion
-- ============================================================================

-- Step 8: Drop problematic policy on programmed_classes if it exists
DROP POLICY IF EXISTS "Players can view classes they are enrolled in" ON public.programmed_classes;

-- Step 9: Verify existing programmed_classes policies
-- We should have these policies:
-- 1. "Trainers can manage their classes" - allows trainers to manage their own classes
-- 2. "Trainers can view classes in their clubs" - allows trainers to view classes in clubs they belong to
-- 3. "Club admins can manage classes in their clubs" - allows club admins full access

-- Let's check if these exist and are not causing recursion
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'programmed_classes'
ORDER BY policyname;

-- Step 10: Drop and recreate read policy for programmed_classes
-- This allows authenticated users to read basic class info without recursion
-- The filtering happens at the class_participants level via RLS
DROP POLICY IF EXISTS "authenticated_users_can_view_classes" ON public.programmed_classes;

CREATE POLICY "authenticated_users_can_view_classes"
ON public.programmed_classes
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- PART 3: Verification and cleanup
-- ============================================================================

-- Add comments
COMMENT ON TABLE class_participants IS 'Student participation in classes. RLS: players view/update own records, trainers manage participants in their classes, club admins manage all.';
COMMENT ON FUNCTION public.is_my_enrollment(UUID) IS 'SECURITY DEFINER: Check if enrollment belongs to current user. Bypasses RLS to prevent recursion.';
COMMENT ON COLUMN class_participants.attendance_confirmed_for_date IS 'Date for which student confirmed attendance';
COMMENT ON COLUMN class_participants.attendance_confirmed_at IS 'When student confirmed attendance';

-- Verify all policies
SELECT
    tablename,
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE tablename IN ('class_participants', 'programmed_classes')
ORDER BY tablename, policyname;
