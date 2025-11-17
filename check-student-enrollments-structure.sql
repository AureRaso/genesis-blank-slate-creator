-- Verificar la estructura de student_enrollments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
ORDER BY ordinal_position;

-- Ver algunos registros de ejemplo
SELECT * FROM student_enrollments LIMIT 5;

-- Ver la relación entre student_enrollments y profiles/auth.users
SELECT
  se.*,
  p.email,
  p.role
FROM student_enrollments se
LEFT JOIN profiles p ON p.id = se.profile_id OR p.email = se.email
LIMIT 5;
