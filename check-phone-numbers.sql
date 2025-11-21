-- Query simple para ver los números de teléfono de mark y mark20

-- student_enrollments
SELECT
  email,
  full_name,
  phone,
  'student_enrollments' as source
FROM student_enrollments
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')

UNION ALL

-- auth.users metadata
SELECT
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'phone' as phone,
  'auth.users.metadata' as source
FROM auth.users
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')

ORDER BY email, source;
