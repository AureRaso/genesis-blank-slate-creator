-- Crear enrollment para merinainfo1@gmail.com

-- 1. Verificar datos actuales del perfil
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

-- 2. Verificar si YA tiene enrollment
SELECT
  id,
  email,
  full_name,
  level,
  status,
  club_id
FROM student_enrollments
WHERE email = 'merinainfo1@gmail.com';

-- 3. Crear enrollment (ejecuta SOLO si el paso 2 no devolvió resultados)
INSERT INTO student_enrollments (
  profile_id,
  email,
  full_name,
  level,
  club_id,
  status,
  created_by
)
SELECT
  p.id,
  p.email,
  p.full_name,
  p.level,
  p.club_id,
  'active',
  p.id
FROM profiles p
WHERE p.email = 'merinainfo1@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM student_enrollments se WHERE se.email = p.email
  );

-- 4. Verificar que se creó correctamente
SELECT
  se.id,
  se.email,
  se.full_name,
  se.level,
  se.status,
  se.club_id,
  c.name as club_name
FROM student_enrollments se
LEFT JOIN clubs c ON c.id = se.club_id
WHERE se.email = 'merinainfo1@gmail.com';
