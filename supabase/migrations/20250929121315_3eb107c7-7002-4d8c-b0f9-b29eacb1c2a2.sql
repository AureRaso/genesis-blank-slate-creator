-- Crear nueva política para que trainers puedan ver todos los estudiantes de sus clubs asignados
CREATE POLICY "Trainers can view students from their assigned clubs" 
ON public.student_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM trainer_clubs tc
    WHERE tc.trainer_profile_id = auth.uid() 
    AND tc.club_id = student_enrollments.club_id
  )
);

-- Actualizar la política existente para que trainers puedan gestionar todos los estudiantes de su club
DROP POLICY IF EXISTS "Trainers can manage their students" ON public.student_enrollments;

CREATE POLICY "Trainers can manage students in their assigned clubs" 
ON public.student_enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM trainer_clubs tc
    WHERE tc.trainer_profile_id = auth.uid() 
    AND tc.club_id = student_enrollments.club_id
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM trainer_clubs tc
    WHERE tc.trainer_profile_id = auth.uid() 
    AND tc.club_id = student_enrollments.club_id
  )
);