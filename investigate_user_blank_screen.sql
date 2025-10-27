-- Investigar usuario con pantalla en blanco al añadir hijos
-- Usuario ID: a1dce7a0-2b7d-4651-89f7-4157cdeb152e

-- 1. Ver información básica del usuario
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- 2. Ver perfil del usuario
SELECT
  id,
  full_name,
  role,
  club_id,
  level,
  created_at,
  updated_at
FROM profiles
WHERE id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- 3. Ver si tiene hijos registrados en account_dependents
SELECT
  ad.id as relationship_id,
  ad.guardian_profile_id,
  ad.dependent_profile_id,
  ad.relationship_type,
  ad.created_at,
  p.full_name as child_name,
  p.role as child_role,
  p.club_id as child_club_id
FROM account_dependents ad
LEFT JOIN profiles p ON p.id = ad.dependent_profile_id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
ORDER BY ad.created_at DESC;

-- 4. Ver si hay perfiles "huérfanos" creados por este guardian (sin relación)
SELECT
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  p.club_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%a1dce7a0-2b7d-4651-89f7-4157cdeb152e%'
   OR u.id IN (
     SELECT dependent_profile_id
     FROM account_dependents
     WHERE guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
   )
ORDER BY u.created_at DESC;

-- 5. Ver las últimas cuentas creadas para detectar si se creó algún hijo reciente
SELECT
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  p.club_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.created_at > NOW() - INTERVAL '2 hours'
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Ver enrollments del guardian (si tiene)
SELECT
  se.id,
  se.student_profile_id,
  se.class_id,
  se.status,
  se.created_at,
  c.name as class_name
FROM student_enrollments se
LEFT JOIN classes c ON c.id = se.class_id
WHERE se.student_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
ORDER BY se.created_at DESC;

-- 7. Ver el club del guardian
SELECT
  c.id,
  c.name,
  c.status
FROM clubs c
WHERE c.id = (
  SELECT club_id
  FROM profiles
  WHERE id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
);

-- 8. Verificar políticas RLS que podrían estar bloqueando
-- (esto es solo informativo, no ejecutará nada)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('account_dependents', 'profiles', 'student_enrollments')
ORDER BY tablename, policyname;
