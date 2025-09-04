-- Actualizar las políticas RLS de waitlists para permitir que trainers del mismo club vean todas las listas de espera del club

-- Eliminar la política restrictiva actual para trainers
DROP POLICY IF EXISTS "Trainers can manage waitlists for their classes" ON waitlists;

-- Crear nueva política que permite a trainers gestionar listas de espera de su club
CREATE POLICY "Trainers can manage waitlists for their club classes" 
ON waitlists 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    JOIN trainer_clubs tc ON tc.club_id = pc.club_id
    WHERE pc.id = waitlists.class_id 
    AND tc.trainer_profile_id = auth.uid()
  )
);