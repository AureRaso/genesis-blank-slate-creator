-- =====================================================
-- Investigar clase "Partido Chicos"
-- Club ID: a66741f0-7ac3-4c1b-a7ca-5601959527aa
-- =====================================================

-- 1. Buscar la clase "Partido Chicos" en el club
SELECT
  pc.id,
  pc.name,
  pc.start_date,
  pc.end_date,
  pc.start_time,
  pc.days_of_week,
  pc.is_active,
  c.name as club_name
FROM programmed_classes pc
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.name ILIKE '%Partido Chicos%'
ORDER BY pc.created_at DESC;

-- 2. Ver participantes de esta clase
SELECT
  cp.id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.confirmed_by_trainer,
  cp.absence_confirmed,
  se.full_name as student_name,
  se.email as student_email,
  pc.name as class_name,
  pc.start_date as class_start_date
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.name ILIKE '%Partido Chicos%'
ORDER BY pc.start_date, se.full_name;

-- 3. Ver participantes SIN confirmar de "Partido Chicos"
SELECT
  cp.id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.confirmed_by_trainer,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date as class_start_date
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.name ILIKE '%Partido Chicos%'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false)
ORDER BY pc.start_date, se.full_name;

-- 4. Contar total vs confirmados
SELECT
  pc.name as class_name,
  pc.start_date,
  COUNT(*) as total_participants,
  COUNT(CASE WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN 1 END) as confirmed_participants,
  COUNT(CASE WHEN cp.attendance_confirmed_for_date IS NULL THEN 1 END) as not_confirmed_participants
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN clubs c ON c.id = pc.club_id
WHERE c.id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.name ILIKE '%Partido Chicos%'
  AND cp.status = 'active'
GROUP BY pc.id, pc.name, pc.start_date
ORDER BY pc.start_date;
