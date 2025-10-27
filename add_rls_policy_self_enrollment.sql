-- Política RLS para permitir que jugadores creen su propio enrollment al completar perfil con Google

-- Ver políticas actuales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- Crear política para permitir a jugadores autenticados crear su propio enrollment
CREATE POLICY "Allow players to create own enrollment"
ON public.student_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo pueden crear enrollment con su propio email
  auth.jwt() ->> 'email' = email
  AND
  -- Solo si no existe ya un enrollment con ese email
  NOT EXISTS (
    SELECT 1
    FROM public.student_enrollments se
    WHERE se.email = student_enrollments.email
    AND se.id != student_enrollments.id
  )
);

-- Verificar que se creó
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'student_enrollments'
  AND policyname = 'Allow players to create own enrollment';
