-- Verificar si Andrea y Victor tienen enrollments
SELECT 
  'Andrea' as user_name,
  se.*
FROM student_enrollments se
WHERE se.email = 'andrearayacoaching@gmail.com'

UNION ALL

SELECT 
  'Victor' as user_name,
  se.*
FROM student_enrollments se
WHERE se.email = 'vpozoyaestabien@gmail.com';
