-- Actualizar el teléfono de Crossmate en student_enrollments
-- El teléfono está en profiles pero no se copió a student_enrollments

-- Ver estado actual
SELECT
  se.id,
  se.email,
  se.full_name,
  se.phone as enrollment_phone,
  p.phone as profile_phone,
  CASE
    WHEN se.phone IS NULL OR se.phone = '' THEN '❌ Sin teléfono en enrollment'
    ELSE '✅ Tiene teléfono: ' || se.phone
  END as phone_status
FROM student_enrollments se
LEFT JOIN profiles p ON p.email = se.email
WHERE se.email = 'crossmatebuildship@gmail.com';

-- Actualizar el teléfono copiándolo desde profiles
UPDATE student_enrollments se
SET phone = p.phone
FROM profiles p
WHERE se.email = p.email
  AND se.email = 'crossmatebuildship@gmail.com'
  AND p.phone IS NOT NULL
  AND (se.phone IS NULL OR se.phone = '');

-- Verificar que se actualizó correctamente
SELECT
  id,
  email,
  full_name,
  phone,
  level,
  club_id,
  created_at
FROM student_enrollments
WHERE email = 'crossmatebuildship@gmail.com';
