-- Verificar el rol actual de sefaca24@gmail.com
SELECT
  id,
  email,
  full_name,
  role,
  club_id,
  created_at,
  updated_at
FROM profiles
WHERE email = 'sefaca24@gmail.com';

-- Si el rol NO es 'owner', ejecuta esto:
-- UPDATE profiles SET role = 'owner' WHERE email = 'sefaca24@gmail.com';
