-- Políticas RLS para enrollment_forms

-- Permitir lectura pública de enrollment_forms por token (para usuarios anónimos con el enlace)
CREATE POLICY "Allow public read enrollment_forms by token"
ON public.enrollment_forms
FOR SELECT
USING (true);

-- Permitir actualización pública de enrollment_forms cuando se completa (para usuarios anónimos)
CREATE POLICY "Allow public update enrollment_forms on completion"
ON public.enrollment_forms
FOR UPDATE
USING (status = 'pending')
WITH CHECK (status IN ('completed', 'expired'));

-- Permitir a trainers/admins crear enrollment_forms
CREATE POLICY "Allow trainers to create enrollment_forms"
ON public.enrollment_forms
FOR INSERT
WITH CHECK (auth.uid() = trainer_profile_id);

-- Permitir a trainers/admins ver sus enrollment_forms
CREATE POLICY "Allow trainers to read their enrollment_forms"
ON public.enrollment_forms
FOR SELECT
USING (auth.uid() = trainer_profile_id);

-- Políticas RLS para student_enrollments

-- Permitir inserciones anónimas de student_enrollments cuando se completa un enrollment_form
DROP POLICY IF EXISTS "Allow public insert via enrollment_forms" ON public.student_enrollments;
CREATE POLICY "Allow public insert via enrollment_forms"
ON public.student_enrollments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.enrollment_forms
    WHERE enrollment_forms.trainer_profile_id = student_enrollments.trainer_profile_id
      AND enrollment_forms.club_id = student_enrollments.club_id
      AND enrollment_forms.status = 'pending'
  )
);
