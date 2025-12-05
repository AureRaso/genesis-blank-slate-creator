SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  t.id as trainer_id,
  t.is_active,
  tc.club_id,
  c.name as club_name
FROM profiles p
LEFT JOIN trainers t ON t.profile_id = p.id
LEFT JOIN trainer_clubs tc ON tc.trainer_profile_id = p.id
LEFT JOIN clubs c ON c.id = tc.club_id
WHERE p.id = 'c179ace5-fc83-483e-83d7-8a408a4eb036';
