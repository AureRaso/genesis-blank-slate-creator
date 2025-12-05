-- Script para verificar los datos de la clase TestM

-- 1. Verificar la clase programada TestM
SELECT
  pc.id,
  pc.name,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.is_active,
  pc.start_time,
  pc.duration_minutes,
  p.full_name as trainer_name,
  c.name as club_name
FROM programmed_classes pc
LEFT JOIN profiles p ON p.id = pc.trainer_profile_id
LEFT JOIN clubs c ON c.id = pc.club_id
WHERE pc.name = 'TestM'
ORDER BY pc.created_at DESC;

-- 2. Verificar las inscripciones del alumno mark20@gmail.com
SELECT
  se.id as enrollment_id,
  se.email,
  se.full_name,
  se.student_profile_id,
  se.club_id,
  se.status
FROM student_enrollments se
WHERE se.email = 'mark20@gmail.com';

-- 3. Verificar los registros en class_participants
SELECT
  cp.id as participant_id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.absence_reason,
  pc.name as class_name,
  se.email as student_email
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'mark20@gmail.com' AND pc.name = 'TestM';

-- 4. Verificar la constraint UNIQUE en class_participants
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'class_participants'::regclass;

-- 5. Buscar registros huérfanos (class_participants sin clase activa)
SELECT
  cp.id,
  cp.class_id,
  cp.student_enrollment_id,
  pc.name,
  pc.is_active
FROM class_participants cp
LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE cp.id IN (
  '339c3757-e3f7-4de8-95dd-32f35e8e6b12',
  '58ddcf29-68f0-41a3-bd04-52b531b8a5e5'
)
OR pc.id IS NULL
OR pc.is_active = FALSE;
