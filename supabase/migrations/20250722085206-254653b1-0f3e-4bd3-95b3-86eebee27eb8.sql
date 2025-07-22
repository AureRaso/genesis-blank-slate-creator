
-- Primero, eliminar la constraint existente que causa problemas
ALTER TABLE public.class_participants 
DROP CONSTRAINT IF EXISTS class_participants_student_profile_id_fkey;

-- Renombrar la columna para mayor claridad
ALTER TABLE public.class_participants 
RENAME COLUMN student_profile_id TO student_enrollment_id;

-- Agregar la nueva foreign key constraint que referencia student_enrollments
ALTER TABLE public.class_participants
ADD CONSTRAINT class_participants_student_enrollment_id_fkey
FOREIGN KEY (student_enrollment_id) REFERENCES public.student_enrollments(id) ON DELETE CASCADE;

-- Actualizar las políticas RLS para usar la nueva estructura
DROP POLICY IF EXISTS "Club admins can manage participants in their club classes" ON public.class_participants;
DROP POLICY IF EXISTS "Trainers can manage participants in their classes" ON public.class_participants;

-- Recrear las políticas con la nueva estructura
CREATE POLICY "Club admins can manage participants in their club classes" 
ON public.class_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.id = class_participants.class_id 
    AND c.created_by_profile_id = auth.uid()
  )
);

CREATE POLICY "Trainers can manage participants in their classes" 
ON public.class_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM programmed_classes pc
    WHERE pc.id = class_participants.class_id 
    AND pc.created_by = auth.uid()
  )
);
