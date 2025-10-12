-- ============================================================================
-- FIX: Infinite recursion in class_participants RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add attendance confirmation fields if they don't exist
ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS attendance_confirmed_for_date DATE,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on today's confirmations
CREATE INDEX IF NOT EXISTS idx_class_participants_attendance_date
ON class_participants(attendance_confirmed_for_date)
WHERE attendance_confirmed_for_date IS NOT NULL;

-- STEP 2: Fix RLS policies to avoid infinite recursion

-- Drop ALL existing policies on class_participants
DROP POLICY IF EXISTS "Trainers can manage participants in their classes" ON public.class_participants;
DROP POLICY IF EXISTS "Club admins can manage participants in their club classes" ON public.class_participants;
DROP POLICY IF EXISTS "Players can view their own class participants" ON public.class_participants;
DROP POLICY IF EXISTS "Players can update their own attendance confirmation" ON public.class_participants;
DROP POLICY IF EXISTS "Students can view their own class participations" ON public.class_participants;

-- Create a SECURITY DEFINER function to check if a student enrollment belongs to the current user
-- This avoids infinite recursion by not querying class_participants in the policy
CREATE OR REPLACE FUNCTION public.is_my_enrollment(enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the current user's email from their profile
  SELECT email INTO user_email
  FROM profiles
  WHERE id = auth.uid();

  -- Check if the enrollment belongs to this user's email
  RETURN EXISTS (
    SELECT 1 FROM student_enrollments se
    WHERE se.id = enrollment_id
    AND se.email = user_email
  );
END;
$$;

-- Add policy for players to view their own participations using the safe function
CREATE POLICY "Players can view their own class participations" ON public.class_participants
  FOR SELECT USING (is_my_enrollment(student_enrollment_id));

-- Add policy for players to update their own attendance confirmation
CREATE POLICY "Players can update their own attendance" ON public.class_participants
  FOR UPDATE USING (is_my_enrollment(student_enrollment_id))
  WITH CHECK (is_my_enrollment(student_enrollment_id));

-- Recreate trainer policy - trainers can manage participants in their classes
CREATE POLICY "Trainers can manage participants in their classes" ON public.class_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_participants.class_id
      AND pc.created_by = auth.uid()
    )
  );

-- Recreate club admin policy
CREATE POLICY "Club admins can manage participants in their club classes" ON public.class_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      JOIN clubs c ON c.id = pc.club_id
      WHERE pc.id = class_participants.class_id
      AND c.created_by_profile_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE class_participants IS 'Stores student participation in programmed classes. RLS allows players to view/update their own records via student_enrollment_id, trainers to manage participants in their classes, and club admins to manage all participants in their club.';
COMMENT ON FUNCTION public.is_my_enrollment(UUID) IS 'Security definer function to check if a student enrollment belongs to the current user without causing RLS recursion';
COMMENT ON COLUMN class_participants.attendance_confirmed_for_date IS 'Date for which the student confirmed attendance';
COMMENT ON COLUMN class_participants.attendance_confirmed_at IS 'Timestamp when the student confirmed attendance';
