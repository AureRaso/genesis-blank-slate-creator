-- =====================================================
-- INVESTIGAR: Estructura de student_enrollments
-- =====================================================

-- Ver todas las columnas de student_enrollments
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
ORDER BY ordinal_position;

-- Ver una muestra de datos
SELECT * FROM student_enrollments LIMIT 5;

-- Ver las relaciones con profiles
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'student_enrollments'
  AND tc.constraint_type = 'FOREIGN KEY';
