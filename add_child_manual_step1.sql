-- PASO 1: Buscar hijos huérfanos creados recientemente para Antonio
-- (Hijos que se crearon pero no tienen relación en account_dependents)

SELECT
  u.id as child_user_id,
  u.email as child_email,
  u.created_at as created_at,
  p.full_name as child_name,
  p.role as child_role,
  p.club_id as child_club_id,
  p.level as child_level
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%@temp.padelock.com%'
  AND u.created_at > '2025-10-22 10:50:00'  -- Después de que Antonio se registró
  AND p.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Mismo club que Antonio
  AND p.role = 'player'  -- Los hijos son players
  AND NOT EXISTS (
    -- Verificar que NO tenga relación en account_dependents
    SELECT 1 FROM account_dependents ad
    WHERE ad.dependent_profile_id = u.id
  )
ORDER BY u.created_at DESC;
