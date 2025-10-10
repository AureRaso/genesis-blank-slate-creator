-- Add DELETE policy for class_slots table
-- Allow admins and trainers to delete their own class slots

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own class slots" ON class_slots;

-- Create new delete policy
-- Admins can delete any class slot
-- Trainers can delete only their own class slots
CREATE POLICY "Users can delete class slots"
ON class_slots
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'trainer'
        AND class_slots.created_by_profile_id = auth.uid()
      )
    )
  )
);
