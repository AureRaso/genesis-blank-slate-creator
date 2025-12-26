-- Migration: Add superadmin role to student_enrollments RLS policies
-- Purpose: Allow superadmins to access student_enrollments for clubs they manage

-- ============================================================================
-- 1. Update the admin_all policy to include superadmin (using ALTER POLICY)
-- ============================================================================

ALTER POLICY "student_enrollments_admin_all"
ON student_enrollments
USING (
  -- Original admin/owner access
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
  -- Superadmin access: can access if club_id is in their assigned clubs
  OR EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_clubs ac ON ac.admin_profile_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'superadmin'
    AND ac.club_id = student_enrollments.club_id
  )
);

-- ============================================================================
-- 2. Update the INSERT policy to include superadmin (using ALTER POLICY)
-- ============================================================================

ALTER POLICY "Allow enrollment creation during signup"
ON student_enrollments
WITH CHECK (
  -- Original admin/owner access
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
  -- Superadmin access
  OR EXISTS (
    SELECT 1 FROM profiles p
    JOIN admin_clubs ac ON ac.admin_profile_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'superadmin'
    AND ac.club_id = student_enrollments.club_id
  )
  -- Student self-registration
  OR student_profile_id = auth.uid()
);

-- ============================================================================
-- Verify the policies were updated
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for student_enrollments updated to include superadmin role';
END $$;
