-- 1. Verificar estructura de la tabla trainers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trainers'
ORDER BY ordinal_position;

-- 2. Verificar si ya existe el registro en trainers
SELECT * FROM trainers WHERE profile_id = 'c179ace5-fc83-483e-83d7-8a408a4eb036';

-- 3. Insertar en trainers sin ON CONFLICT (solo si no existe)
INSERT INTO trainers (profile_id, specialty, photo_url, is_active)
SELECT 'c179ace5-fc83-483e-83d7-8a408a4eb036', null, null, true
WHERE NOT EXISTS (
  SELECT 1 FROM trainers WHERE profile_id = 'c179ace5-fc83-483e-83d7-8a408a4eb036'
);

-- 4. Verificar el resultado final
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
