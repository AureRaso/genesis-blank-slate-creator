-- Ver la estructura COMPLETA de student_enrollments
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver un registro de ejemplo para entender la estructura
SELECT *
FROM student_enrollments
LIMIT 1;
