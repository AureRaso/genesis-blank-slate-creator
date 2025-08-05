-- Agregar política RLS para que los jugadores puedan ver las clases programadas de su club
CREATE POLICY "Players can view active classes in their club"
ON public.programmed_classes
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.club_id = programmed_classes.club_id
    AND profiles.role = 'player'
  )
);