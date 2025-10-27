-- Información completa del usuario: f858e29b-a8de-434a-a7ed-329cbc074f42

-- 1. Información del perfil
SELECT
  id,
  email,
  full_name,
  role,
  club_id,
  created_at
FROM profiles
WHERE id = 'f858e29b-a8de-434a-a7ed-329cbc074f42';

-- 2. Información de enrollment como estudiante
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

-- 3. Clases en las que está inscrito
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

-- 4. Listas de espera
SELECT
  cw.id,
  pc.name as class_name,
  pc.scheduled_date,
  pc.start_time,
  cw.joined_at,
  cw.position
FROM class_waitlist cw
JOIN programmed_classes pc ON pc.id = cw.class_id
WHERE cw.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
ORDER BY cw.joined_at DESC;

-- 5. Registros de pago
SELECT
  pr.id,
  pr.amount,
  pr.payment_method,
  pr.status,
  pr.payment_date,
  pr.period_start,
  pr.period_end,
  pr.created_at
FROM payment_records pr
WHERE pr.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
ORDER BY pr.created_at DESC;

-- 6. Inscripciones en ligas
SELECT
  le.id,
  l.name as league_name,
  le.status,
  le.enrolled_at
FROM league_enrollments le
JOIN leagues l ON l.id = le.league_id
WHERE le.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
ORDER BY le.enrolled_at DESC;

-- 7. Resumen general
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
AND cp.absence_confirmed = true
UNION ALL
SELECT
  'Pagos registrados' as tipo,
  COUNT(*) as cantidad
FROM payment_records pr
WHERE pr.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
)
UNION ALL
SELECT
  'En lista de espera' as tipo,
  COUNT(*) as cantidad
FROM class_waitlist cw
WHERE cw.student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE profile_id = 'f858e29b-a8de-434a-a7ed-329cbc074f42'
);
