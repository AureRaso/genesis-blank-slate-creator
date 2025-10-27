-- EJECUTA CADA CONSULTA POR SEPARADO EN SUPABASE SQL EDITOR

-- ============================================
-- 1. PERFIL BÁSICO
-- ============================================
SELECT
  id,
  email,
  full_name,
  role,
  club_id,
  created_at
FROM profiles
WHERE id = 'f858e29b-a8de-434a-a7ed-329cbc074f42';


-- ============================================
-- 2. ENROLLMENT COMO ESTUDIANTE
-- ============================================
SELECT
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.level,
  se.status,
  se.club_id,
  c.name as club_name,
  se.created_at,
  se.created_by
FROM student_enrollments se
LEFT JOIN clubs c ON c.id = se.club_id
WHERE se.profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42';


-- ============================================
-- 3. CLASES (últimas 20)
-- ============================================
SELECT
  pc.name as class_name,
  pc.scheduled_date,
  pc.start_time,
  pc.end_time,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.is_substitute,
  t.full_name as trainer_name
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
LEFT JOIN profiles t ON t.id = pc.trainer_id
WHERE cp.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
ORDER BY pc.scheduled_date DESC, pc.start_time DESC
LIMIT 20;


-- ============================================
-- 4. RESUMEN RÁPIDO
-- ============================================
SELECT
  'Clases totales' as tipo,
  COUNT(*) as cantidad
FROM class_participants cp
WHERE cp.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
UNION ALL
SELECT
  'Clases confirmadas' as tipo,
  COUNT(*) as cantidad
FROM class_participants cp
WHERE cp.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
AND cp.attendance_confirmed_for_date IS NOT NULL
UNION ALL
SELECT
  'Ausencias' as tipo,
  COUNT(*) as cantidad
FROM class_participants cp
WHERE cp.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
AND cp.absence_confirmed = true;
