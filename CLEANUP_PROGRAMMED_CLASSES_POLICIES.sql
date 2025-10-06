-- ============================================================================
-- CLEANUP: Remove all problematic policies from programmed_classes
-- and keep only the essential non-recursive ones
-- ============================================================================

-- Drop ALL policies on programmed_classes
DROP POLICY IF EXISTS "Club admins can manage classes in their clubs" ON public.programmed_classes;
DROP POLICY IF EXISTS "Club admins can view all club classes" ON public.programmed_classes;
DROP POLICY IF EXISTS "Club admins can view trainer classes in their clubs" ON public.programmed_classes;
DROP POLICY IF EXISTS "Creators can view their own classes" ON public.programmed_classes;
DROP POLICY IF EXISTS "Players can view active classes in their club" ON public.programmed_classes;
DROP POLICY IF EXISTS "Players can view classes they participate in" ON public.programmed_classes;
DROP POLICY IF EXISTS "Trainers can manage their classes" ON public.programmed_classes;
DROP POLICY IF EXISTS "Trainers can view classes in their clubs" ON public.programmed_classes;
DROP POLICY IF EXISTS "authenticated_users_can_view_classes" ON public.programmed_classes;

-- ============================================================================
-- Create ONLY the essential policies that DON'T cause recursion
-- ============================================================================

-- Policy 1: Allow all authenticated users to VIEW classes
-- The filtering of which participants they can see happens at class_participants level
CREATE POLICY "allow_read_programmed_classes"
ON public.programmed_classes
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Trainers can manage (INSERT, UPDATE, DELETE) their OWN classes
CREATE POLICY "trainers_manage_own_classes"
ON public.programmed_classes
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 3: Club admins can manage ALL classes in their clubs
CREATE POLICY "club_admins_manage_club_classes"
ON public.programmed_classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clubs c
    WHERE c.id = programmed_classes.club_id
    AND c.created_by_profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clubs c
    WHERE c.id = programmed_classes.club_id
    AND c.created_by_profile_id = auth.uid()
  )
);

-- ============================================================================
-- Verification
-- ============================================================================

-- Show all policies on programmed_classes (should only see 3 now)
SELECT
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE tablename = 'programmed_classes'
ORDER BY policyname;

-- Add comment
COMMENT ON TABLE programmed_classes IS 'Programmed recurring classes. RLS: All authenticated users can read (filtering happens at participants level), trainers manage own classes, club admins manage all club classes.';
