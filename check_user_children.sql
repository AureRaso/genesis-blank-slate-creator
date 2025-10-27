-- Verificar hijos del usuario Antonio Nocete Conde
-- Guardian ID: a1dce7a0-2b7d-4651-89f7-4157cdeb152e

-- 1. Ver todos los hijos registrados en account_dependents
SELECT
  ad.id as relationship_id,
  ad.guardian_profile_id,
  ad.dependent_profile_id,
  ad.relationship_type,
  ad.created_at as relationship_created,
  p.full_name as child_name,
  p.role as child_role,
  p.email as child_email,
  p.level as child_level,
  p.club_id as child_club_id,
  p.created_at as child_profile_created
FROM account_dependents ad
LEFT JOIN profiles p ON p.id = ad.dependent_profile_id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
ORDER BY ad.created_at DESC;

-- 2. Ver usuarios creados recientemente (últimas 2 horas) por si hay hijos "huérfanos"
SELECT
  u.id,
  u.email,
  u.created_at as auth_created,
  p.full_name,
  p.role,
  p.level,
  p.club_id,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.created_at > NOW() - INTERVAL '2 hours'
  AND p.role = 'player'
  AND u.email LIKE '%@temp.padelock.com%'
ORDER BY u.created_at DESC;

-- 3. Verificar si hay alguna sesión activa problemática
SELECT
  id,
  user_id,
  created_at,
  updated_at,
  NOT_AFTER as expires_at
FROM auth.sessions
WHERE user_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
ORDER BY created_at DESC
LIMIT 5;
