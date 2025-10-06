-- Allow trainers to view student enrollments for participants in their classes
-- This enables trainers to see student names and emails in their class rosters

-- Drop if exists (try both full and truncated names)
DROP POLICY IF EXISTS "Trainers can view enrollments of their class participants" ON public.student_enrollments;
DROP POLICY IF EXISTS "Trainers can view enrollments of their class particip" ON public.student_enrollments;

-- Create the policy
CREATE POLICY "Trainers can view enrollments of their class participants" ON public.student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE cp.student_enrollment_id = student_enrollments.id
        AND pc.trainer_profile_id = auth.uid()
    )
  );

COMMENT ON POLICY "Trainers can view enrollments of their class participants" ON public.student_enrollments
IS 'Allows trainers to see student enrollment details (name, email) for students in their classes';
