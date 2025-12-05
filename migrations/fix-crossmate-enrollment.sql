-- Fix enrollment for crossmatebuildship@gmail.com
-- Este usuario se registró con Google pero no tiene enrollment

-- PASO 1: Verificar estado actual
SELECT
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.role,
  p.club_id,
  p.level,
  CASE
    WHEN p.role IS NULL THEN '❌ Falta role'
    WHEN p.role != 'player' THEN '❌ Role incorrecto: ' || p.role
    ELSE '✅ Role correcto'
  END as role_status,
  CASE
    WHEN p.club_id IS NULL THEN '❌ Falta club_id'
    ELSE '✅ Club asignado: ' || p.club_id::text
  END as club_status,
  CASE
    WHEN se.id IS NOT NULL THEN '✅ Ya tiene enrollment'
    ELSE '❌ NO tiene enrollment'
  END as enrollment_status
FROM profiles p
LEFT JOIN student_enrollments se ON se.email = p.email
WHERE p.email = 'crossmatebuildship@gmail.com';

-- PASO 2: Ver qué club_id debería tener
-- (Lista los clubs disponibles para que elijas cuál asignar)
SELECT
  id as club_id,
  name as club_name,
  created_by_profile_id
FROM clubs
ORDER BY created_at DESC
LIMIT 10;

-- PASO 3: OPCIÓN A - Si le falta el role y/o club_id, actualizar profiles primero
-- DESCOMENTA Y AJUSTA ESTOS VALORES SEGÚN NECESITES:

/*
UPDATE profiles
SET
  role = 'player',  -- Asignar role de jugador
  club_id = 'PONER_CLUB_ID_AQUI',  -- Reemplazar con el UUID del club
  full_name = COALESCE(full_name, 'Crossmate'),  -- Asegurar que tiene nombre
  phone = COALESCE(phone, (SELECT phone FROM auth.users WHERE email = 'crossmatebuildship@gmail.com'))  -- Copiar teléfono de auth.users si existe
WHERE email = 'crossmatebuildship@gmail.com';
*/

-- PASO 4: OPCIÓN B - Crear enrollment directamente (si ya tiene role='player' y club_id)
-- DESCOMENTA DESPUÉS DE VERIFICAR QUE TIENE role Y club_id:

/*
INSERT INTO student_enrollments (
  trainer_profile_id,
  created_by_profile_id,
  email,
  full_name,
  phone,
  level,
  club_id,
  status,
  enrollment_period,
  weekly_days,
  preferred_times
)
SELECT
  -- Buscar un trainer del club del jugador
  COALESCE(
    (SELECT p.id
     FROM profiles p
     INNER JOIN trainer_clubs tc ON tc.trainer_profile_id = p.id
     WHERE tc.club_id = player.club_id
     AND p.role = 'trainer'
     LIMIT 1),
    (SELECT id
     FROM profiles
     WHERE role = 'admin'
     LIMIT 1)
  ) as trainer_profile_id,
  player.id as created_by_profile_id,
  player.email,
  COALESCE(player.full_name, 'Crossmate') as full_name,
  COALESCE(player.phone, '') as phone,
  COALESCE(player.level, 3) as level,
  player.club_id,
  'active' as status,
  'mensual' as enrollment_period,
  ARRAY[]::text[] as weekly_days,
  ARRAY[]::text[] as preferred_times
FROM profiles player
WHERE player.email = 'crossmatebuildship@gmail.com'
  AND player.role = 'player'
  AND player.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM student_enrollments se
    WHERE se.email = player.email
  );
*/

-- PASO 5: Verificar que se creó correctamente
SELECT
  se.id as enrollment_id,
  se.email,
  se.full_name,
  se.phone,
  se.level,
  se.club_id,
  se.status,
  se.created_at,
  c.name as club_name
FROM student_enrollments se
LEFT JOIN clubs c ON c.id = se.club_id
WHERE se.email = 'crossmatebuildship@gmail.com';
