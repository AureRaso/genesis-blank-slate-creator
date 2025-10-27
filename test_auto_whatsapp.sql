-- Verificar datos del jugador y la clase para la prueba

-- 1. Buscar el jugador Mark
SELECT 
  id as profile_id,
  email,
  full_name,
  level,
  role
FROM profiles
WHERE email = 'mark@gmail.com';

-- 2. Buscar la clase "Lunes 27 - Pista 1 - Argentinas (prueba)"
SELECT 
  id as class_id,
  name,
  start_time,
  duration_minutes,
  club_id
FROM programmed_classes
WHERE name LIKE '%Argentinas%prueba%'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar si Mark está en esa clase
SELECT 
  cp.id as participant_id,
  cp.absence_confirmed,
  se.full_name,
  se.email,
  se.level,
  pc.name as class_name
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.programmed_class_id
WHERE se.email = 'mark@gmail.com'
  AND pc.name LIKE '%Argentinas%prueba%'
ORDER BY cp.created_at DESC
LIMIT 5;

-- 4. Ver grupos WhatsApp disponibles
SELECT 
  id,
  group_name,
  level_target,
  group_chat_id,
  is_active
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY level_target;
