-- Migration: Add superadmin role and admin_clubs table
-- Purpose: Allow admins to manage multiple clubs with a club selector
-- The superadmin role works exactly like admin, but can switch between assigned clubs

-- ============================================================================
-- 1. Create admin_clubs table (similar to trainer_clubs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate assignments
    UNIQUE(admin_profile_id, club_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS admin_clubs_admin_profile_id_idx ON public.admin_clubs(admin_profile_id);
CREATE INDEX IF NOT EXISTS admin_clubs_club_id_idx ON public.admin_clubs(club_id);

-- Add comment
COMMENT ON TABLE public.admin_clubs IS 'Associates superadmin users with multiple clubs they can manage. The superadmin selects which club to view/manage at any time.';

-- ============================================================================
-- 2. Enable RLS on admin_clubs
-- ============================================================================

ALTER TABLE public.admin_clubs ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can view their own club assignments
CREATE POLICY "Superadmins can view their own club assignments"
ON public.admin_clubs
FOR SELECT
TO authenticated
USING (
    admin_profile_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
);

-- Policy: Only owners can manage admin_clubs assignments
CREATE POLICY "Owners can manage admin_clubs"
ON public.admin_clubs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
);

-- ============================================================================
-- 3. No need to alter profiles table - role is TEXT and accepts any value
--    We just need to use 'superadmin' as a new role value
-- ============================================================================

-- Add comment to document the new role
COMMENT ON COLUMN public.profiles.role IS 'User role: owner (super admin all clubs), superadmin (admin of assigned clubs via admin_clubs), admin (admin of single club via club_id), trainer, player, guardian';
