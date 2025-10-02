-- Agregar política para que los estudiantes puedan ver sus propias participaciones en clases
CREATE POLICY "Students can view their own class participations"
ON public.class_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM student_enrollments se
    JOIN profiles p ON se.created_by_profile_id = p.id
    WHERE se.id = class_participants.student_enrollment_id
    AND p.id = auth.uid()
  )
);