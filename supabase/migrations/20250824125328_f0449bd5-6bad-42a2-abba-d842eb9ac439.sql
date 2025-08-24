-- Drop the incorrect policy first
DROP POLICY IF EXISTS "Club admins can view trainer classes in their clubs" ON public.programmed_classes;

-- Create the corrected policy that checks trainer_profile_id instead of created_by
CREATE POLICY "Club admins can view trainer classes in their clubs" 
ON public.programmed_classes 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 
    FROM clubs c
    JOIN trainer_clubs tc ON tc.club_id = c.id
    WHERE c.id = programmed_classes.club_id 
    AND c.created_by_profile_id = auth.uid()
    AND tc.trainer_profile_id = programmed_classes.trainer_profile_id
  )
);