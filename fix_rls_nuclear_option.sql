-- ============================================================================
-- NUCLEAR OPTION: Completely rebuild class_participants RLS from scratch
-- This will temporarily disable RLS, drop all policies, and rebuild them
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Disable RLS temporarily to allow access
ALTER TABLE public.class_participants DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies (including any we might have missed)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'class_participants' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_participants', r.policyname);
    END LOOP;
END $$;

-- STEP 3: Drop the is_my_enrollment function if it exists
DROP FUNCTION IF EXISTS public.is_my_enrollment(UUID);

-- STEP 4: Add attendance fields if they don't exist
ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS attendance_confirmed_for_date DATE,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_class_participants_attendance_date
ON class_participants(attendance_confirmed_for_date)
WHERE attendance_confirmed_for_date IS NOT NULL;

-- STEP 5: Create a simpler, safer function that avoids recursion
-- This function is SECURITY DEFINER which means it runs with elevated privileges
-- and bypasses RLS, preventing recursion
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_my_enrollment(UUID) TO authenticated;

-- STEP 6: Re-enable RLS
ALTER TABLE public.class_participants ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create new, clean policies

-- Policy 1: Players can view their own participations
CREATE POLICY "players_view_own_participations"
ON public.class_participants
FOR SELECT
TO authenticated
USING (is_my_enrollment(student_enrollment_id));

-- Policy 2: Players can update their own attendance
CREATE POLICY "players_update_own_attendance"
ON public.class_participants
FOR UPDATE
TO authenticated
USING (is_my_enrollment(student_enrollment_id))
WITH CHECK (is_my_enrollment(student_enrollment_id));

-- Policy 3: Trainers can manage participants in their own classes
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

-- Policy 4: Club admins can manage all participants in their club's classes
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

-- STEP 8: Add helpful comments
COMMENT ON TABLE class_participants IS 'Stores student participation in programmed classes. RLS policies allow: (1) players to view/update their own records, (2) trainers to manage participants in their classes, (3) club admins to manage all participants in their clubs classes.';
COMMENT ON FUNCTION public.is_my_enrollment(UUID) IS 'SECURITY DEFINER function to safely check if a student enrollment belongs to the current authenticated user. Bypasses RLS to prevent infinite recursion.';

-- STEP 9: Verify the policies were created
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'class_participants'
ORDER BY policyname;
