-- Obtener trainers del club Hespérides
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.club_id,
  c.name as club_name
FROM profiles p
LEFT JOIN clubs c ON c.id = p.club_id
WHERE p.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND p.role = 'trainer'
ORDER BY p.created_at ASC;
