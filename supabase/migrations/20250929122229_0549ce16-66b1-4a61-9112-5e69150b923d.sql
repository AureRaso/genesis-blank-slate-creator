-- Eliminar políticas existentes de class_participants para recrearlas
DROP POLICY IF EXISTS "Club admins can manage participants in their club classes" ON public.class_participants;
DROP POLICY IF EXISTS "Trainers can manage participants in their classes" ON public.class_participants;

-- Nueva política para que trainers puedan gestionar participantes en clases de sus clubs asignados
CREATE POLICY "Trainers can manage participants in assigned club classes" 
ON public.class_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    JOIN trainer_clubs tc ON pc.club_id = tc.club_id
    WHERE pc.id = class_participants.class_id 
    AND tc.trainer_profile_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    JOIN trainer_clubs tc ON pc.club_id = tc.club_id
    WHERE pc.id = class_participants.class_id 
    AND tc.trainer_profile_id = auth.uid()
  )
);

-- Política para que club admins puedan gestionar participantes en sus clubs
CREATE POLICY "Club admins can manage participants in their clubs" 
ON public.class_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    JOIN clubs c ON pc.club_id = c.id
    WHERE pc.id = class_participants.class_id 
    AND c.created_by_profile_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    JOIN clubs c ON pc.club_id = c.id
    WHERE pc.id = class_participants.class_id 
    AND c.created_by_profile_id = auth.uid()
  )
);