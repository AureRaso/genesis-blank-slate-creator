-- Ver la estructura de la tabla student_enrollments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
  AND table_schema = 'public'
ORDER BY ordinal_position;
