-- Add RLS policies for scheduled_classes that are created from programmed_classes
-- (not from templates)

-- Drop old policies that rely on template_id (these might not exist, but we try anyway)
DROP POLICY IF EXISTS "Trainers can view and manage their classes" ON public.scheduled_classes;
DROP POLICY IF EXISTS "Admins can manage classes in their clubs" ON public.scheduled_classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.scheduled_classes;

-- Create new policies that work with both template_id and programmed_class_id

-- Policy for trainers (works with both templates and programmed classes)
CREATE POLICY "Trainers can manage their scheduled classes"
  ON public.scheduled_classes
  FOR ALL
  USING (
    -- Check if user is the trainer assigned to this scheduled class
    trainer_profile_id = auth.uid()
    OR
    -- Or check if they're a trainer in the club
    EXISTS (
      SELECT 1 FROM public.trainer_clubs tc
      WHERE tc.trainer_profile_id = auth.uid()
      AND tc.club_id = scheduled_classes.club_id
    )
  );

-- Policy for admins (works with both templates and programmed classes)
CREATE POLICY "Admins can manage scheduled classes in their clubs"
  ON public.scheduled_classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs c
      WHERE c.id = scheduled_classes.club_id
      AND c.created_by_profile_id = auth.uid()
    )
  );

-- Policy for players to view their classes (read-only)
CREATE POLICY "Players can view their enrolled scheduled classes"
  ON public.scheduled_classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.class_participants cp
      JOIN public.student_enrollments se ON cp.student_enrollment_id = se.id
      JOIN public.programmed_classes pc ON cp.class_id = pc.id
      WHERE pc.id = scheduled_classes.programmed_class_id
      AND (se.created_by_profile_id = auth.uid() OR se.id::text = auth.uid()::text)
    )
  );

COMMENT ON POLICY "Trainers can manage their scheduled classes" ON public.scheduled_classes IS
'Allows trainers to manage scheduled classes either by being the assigned trainer or being a trainer in the club';

COMMENT ON POLICY "Admins can manage scheduled classes in their clubs" ON public.scheduled_classes IS
'Allows club admins to manage all scheduled classes in their clubs';

COMMENT ON POLICY "Players can view their enrolled scheduled classes" ON public.scheduled_classes IS
'Allows players to view scheduled classes they are enrolled in through class_participants';
