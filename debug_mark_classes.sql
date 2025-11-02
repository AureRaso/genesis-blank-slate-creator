-- Debug: Verificar clases de Mark en Hespérides

-- 1. Ver perfil de Mark
SELECT id, email, full_name, role, club_id, level
FROM profiles
WHERE email = 'mark@gmail.com';

-- 2. Ver participaciones de Mark en class_participants
SELECT
  cp.id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.status,
  cp.created_at,
  cp.confirmed_at,
  cp.is_substitute
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'mark@gmail.com'
ORDER BY cp.created_at DESC;

-- 3. Ver las clases programadas que existen para esos class_id
SELECT
  pc.id,
  pc.name,
  pc.start_date,
  pc.end_date,
  pc.days_of_week,
  pc.start_time,
  pc.club_id,
  pc.is_open,
  pc.created_at
FROM programmed_classes pc
WHERE pc.id IN (
  SELECT DISTINCT cp.class_id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE se.email = 'mark@gmail.com'
)
ORDER BY pc.created_at DESC;

-- 4. Ver si existe una clase llamada "Volea" en Hespérides
SELECT
  id,
  name,
  start_date,
  end_date,
  days_of_week,
  start_time,
  club_id,
  is_open,
  created_at
FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND name ILIKE '%volea%'
ORDER BY created_at DESC;

-- 5. Ver TODAS las clases programadas de Hespérides
SELECT
  id,
  name,
  start_date,
  end_date,
  days_of_week,
  start_time,
  club_id,
  is_open,
  created_at
FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY created_at DESC;

-- 6. Ver enrollment de Mark
SELECT
  id,
  full_name,
  email,
  phone,
  level,
  club_id,
  student_profile_id,
  status,
  created_at
FROM student_enrollments
WHERE email = 'mark@gmail.com';
