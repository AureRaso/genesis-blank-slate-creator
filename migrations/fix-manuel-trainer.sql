-- 1. Verificar si existe en la tabla trainers
SELECT * FROM trainers WHERE profile_id = 'c179ace5-fc83-483e-83d7-8a408a4eb036';

-- 2. Si no existe, crear el registro en trainers
INSERT INTO trainers (profile_id, specialty, photo_url, is_active)
VALUES ('c179ace5-fc83-483e-83d7-8a408a4eb036', null, null, true)
ON CONFLICT (profile_id) DO NOTHING;

-- 3. Verificar si existe en trainer_clubs
SELECT * FROM trainer_clubs WHERE trainer_profile_id = 'c179ace5-fc83-483e-83d7-8a408a4eb036';

-- 4. Si no existe, crear la relación trainer-club
INSERT INTO trainer_clubs (trainer_profile_id, club_id)
VALUES ('c179ace5-fc83-483e-83d7-8a408a4eb036', 'a994e74e-0a7f-4721-8c0f-e23100a01614')
ON CONFLICT (trainer_profile_id, club_id) DO NOTHING;

-- 5. Verificar el resultado final
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
