-- Verificar políticas RLS para student_enrollments y class_participants

-- 1. Políticas de student_enrollments
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- 2. Políticas de class_participants
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'class_participants'
ORDER BY policyname;

-- 3. Verificar si RLS está habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('student_enrollments', 'class_participants')
    AND schemaname = 'public';
