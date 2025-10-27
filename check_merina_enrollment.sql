-- Verificar datos del usuario merinainfo1@gmail.com

-- 1. Verificar perfil
SELECT
  id,
  email,
  full_name,
  role,
  club_id,
  level,
  created_at
FROM profiles
WHERE email = 'merinainfo1@gmail.com';

-- 2. Verificar si tiene student_enrollment
SELECT
  se.id,
  se.profile_id,
  se.email,
  se.full_name,
  se.level,
  se.status,
  se.club_id,
  c.name as club_name,
  se.created_at,
  se.created_by
FROM student_enrollments se
LEFT JOIN clubs c ON c.id = se.club_id
WHERE se.email = 'merinainfo1@gmail.com';

-- 3. Ver TODOS los enrollments del club Hespérides
SELECT
  se.id,
  se.email,
  se.full_name,
  se.level,
  se.status,
  se.created_at
FROM student_enrollments se
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY se.created_at DESC
LIMIT 10;
