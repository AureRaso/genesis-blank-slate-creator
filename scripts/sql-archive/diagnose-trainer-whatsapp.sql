-- Diagnóstico del problema de WhatsApp para trainer Juan Ortega
-- Trainer ID: 16912a96-8d86-452e-93f7-bece83863865
-- Club ID: bbc10821-1c94-4b62-97ac-2fde0708cefd

-- 1. Verificar perfil del trainer
SELECT 
  '1. PERFIL DEL TRAINER' as seccion,
  id,
  full_name,
  email,
  role,
  club_id,
  phone
FROM profiles
WHERE id = '16912a96-8d86-452e-93f7-bece83863865';

-- 2. Verificar si existe en trainer_clubs
SELECT 
  '2. TRAINER_CLUBS' as seccion,
  tc.trainer_profile_id,
  tc.club_id,
  c.name as club_name
FROM trainer_clubs tc
LEFT JOIN clubs c ON c.id = tc.club_id
WHERE tc.trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865';

-- 3. Buscar grupos de WhatsApp asignados específicamente a este trainer
SELECT 
  '3. GRUPOS ASIGNADOS AL TRAINER (trainer_profile_id)' as seccion,
  id,
  group_name,
  group_chat_id,
  is_active,
  club_id,
  trainer_profile_id,
  created_at
FROM whatsapp_groups
WHERE trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865';

-- 4. Buscar grupos de WhatsApp del club del trainer
SELECT 
  '4. GRUPOS DEL CLUB (club_id = bbc10821-1c94-4b62-97ac-2fde0708cefd)' as seccion,
  id,
  group_name,
  group_chat_id,
  is_active,
  club_id,
  trainer_profile_id,
  created_at
FROM whatsapp_groups
WHERE club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd';

-- 5. Verificar TODOS los grupos activos de WhatsApp
SELECT 
  '5. TODOS LOS GRUPOS ACTIVOS' as seccion,
  wg.id,
  wg.group_name,
  wg.group_chat_id,
  wg.is_active,
  c.name as club_name,
  p.full_name as trainer_name,
  wg.club_id,
  wg.trainer_profile_id
FROM whatsapp_groups wg
LEFT JOIN clubs c ON c.id = wg.club_id
LEFT JOIN profiles p ON p.id = wg.trainer_profile_id
WHERE wg.is_active = true
ORDER BY c.name, wg.group_name;

-- 6. Simular la lógica del hook useCurrentUserWhatsAppGroup para este trainer
WITH trainer_info AS (
  SELECT 
    id as trainer_id,
    club_id as profile_club_id
  FROM profiles
  WHERE id = '16912a96-8d86-452e-93f7-bece83863865'
),
trainer_club_fallback AS (
  SELECT club_id
  FROM trainer_clubs
  WHERE trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865'
  LIMIT 1
)
SELECT 
  '6. SIMULACIÓN DEL HOOK' as seccion,
  'Paso 1: Buscar por trainer_profile_id' as paso,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM whatsapp_groups 
      WHERE is_active = true 
      AND trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865'
    ) THEN 'ENCONTRADO ✓'
    ELSE 'NO ENCONTRADO ✗'
  END as resultado
UNION ALL
SELECT 
  '6. SIMULACIÓN DEL HOOK',
  'Paso 2: club_id en profile',
  COALESCE(
    (SELECT profile_club_id::text FROM trainer_info),
    'NULL ✗'
  )
UNION ALL
SELECT 
  '6. SIMULACIÓN DEL HOOK',
  'Paso 3: Buscar en trainer_clubs',
  COALESCE(
    (SELECT club_id::text FROM trainer_club_fallback),
    'NULL ✗'
  )
UNION ALL
SELECT 
  '6. SIMULACIÓN DEL HOOK',
  'Paso 4: Buscar grupo por club_id',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM whatsapp_groups wg
      CROSS JOIN trainer_info ti
      WHERE wg.is_active = true 
      AND wg.club_id = ti.profile_club_id
    ) THEN 'ENCONTRADO ✓'
    ELSE 'NO ENCONTRADO ✗'
  END;
