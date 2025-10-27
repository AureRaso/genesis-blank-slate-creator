-- ========================================
-- VERIFICACIÓN COMPLETA: Antonio y su hijo
-- ========================================

-- 1. Verificar información del guardian
SELECT
  'GUARDIAN' as type,
  id,
  full_name,
  email,
  role,
  club_id,
  level
FROM profiles
WHERE id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- 2. Verificar información del hijo
SELECT
  'HIJO' as type,
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.club_id,
  p.level
FROM profiles p
INNER JOIN account_dependents ad ON ad.dependent_profile_id = p.id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- 3. Verificar la relación
SELECT
  ad.id as relationship_id,
  ad.guardian_profile_id,
  ad.dependent_profile_id,
  ad.relationship_type,
  ad.birth_date,
  ad.created_at,
  g.full_name as guardian_name,
  c.full_name as child_name
FROM account_dependents ad
LEFT JOIN profiles g ON g.id = ad.guardian_profile_id
LEFT JOIN profiles c ON c.id = ad.dependent_profile_id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- 4. Contar hijos del guardian
SELECT
  COUNT(*) as total_hijos
FROM account_dependents
WHERE guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';
