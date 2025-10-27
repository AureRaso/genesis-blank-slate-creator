-- Ver las columnas de la tabla student_enrollments
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
ORDER BY ordinal_position;
