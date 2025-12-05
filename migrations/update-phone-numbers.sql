-- Actualizar números de teléfono de los usuarios de prueba

-- Actualizar mark@gmail.com con +34662632906
UPDATE student_enrollments
SET
  phone = '662632906',
  updated_at = NOW()
WHERE email = 'mark@gmail.com';

-- Actualizar mark20@gmail.com con +34605669244
UPDATE student_enrollments
SET
  phone = '605669244',
  updated_at = NOW()
WHERE email = 'mark20@gmail.com';

-- Verificar los cambios
SELECT
  email,
  full_name,
  phone,
  '34' || phone as phone_with_country_code,
  updated_at
FROM student_enrollments
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')
ORDER BY email;
