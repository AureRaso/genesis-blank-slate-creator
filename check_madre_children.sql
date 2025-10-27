-- Verificar el perfil de madre@gmail.com
SELECT
  id,
  email,
  full_name,
  role,
  club_id
FROM profiles
WHERE email = 'madre@gmail.com';

-- Verificar relaciones en account_dependents para madre
SELECT
  ad.id,
  ad.guardian_profile_id,
  ad.dependent_profile_id,
  ad.relationship_type,
  ad.created_at,
  p_guardian.email as guardian_email,
  p_child.email as child_email,
  p_child.full_name as child_name
FROM account_dependents ad
JOIN profiles p_guardian ON ad.guardian_profile_id = p_guardian.id
JOIN profiles p_child ON ad.dependent_profile_id = p_child.id
WHERE p_guardian.email = 'madre@gmail.com';

-- Ver todos los registros de account_dependents
SELECT
  ad.id,
  ad.guardian_profile_id,
  ad.dependent_profile_id,
  ad.relationship_type,
  p_guardian.email as guardian_email,
  p_guardian.full_name as guardian_name,
  p_child.email as child_email,
  p_child.full_name as child_name
FROM account_dependents ad
JOIN profiles p_guardian ON ad.guardian_profile_id = p_guardian.id
JOIN profiles p_child ON ad.dependent_profile_id = p_child.id
ORDER BY ad.created_at DESC
LIMIT 10;
