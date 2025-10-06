-- Fix trainer RLS policy to use trainer_profile_id instead of created_by
-- This allows trainers to see participants in classes where they are assigned as trainer

-- Drop the old policy
DROP POLICY IF EXISTS "Trainers can manage participants in their classes" ON public.class_participants;

-- Recreate with correct field
CREATE POLICY "Trainers can manage participants in their classes" ON public.class_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_participants.class_id
      AND pc.trainer_profile_id = auth.uid()
    )
  );

COMMENT ON POLICY "Trainers can manage participants in their classes" ON public.class_participants
IS 'Allows trainers to view and manage participants in classes where they are assigned as trainer (trainer_profile_id)';
