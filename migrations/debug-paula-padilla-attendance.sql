-- Debug Paula Padilla attendance issue for Jueves - Pista 2 class on 2025-12-04

-- 1. Find Paula Padilla's student enrollment
SELECT
  'Paula Padilla Student Enrollment' as query_name,
  id,
  full_name,
  email,
  phone,
  status,
  club_id
FROM student_enrollments
WHERE full_name ILIKE '%Paula Padilla%'
ORDER BY created_at DESC;

-- 2. Find the "Jueves - Pista 2" class
SELECT
  'Jueves - Pista 2 Class' as query_name,
  id,
  name,
  start_time,
  duration_minutes,
  days_of_week,
  start_date,
  end_date,
  max_participants,
  club_id,
  trainer_profile_id,
  is_active
FROM programmed_classes
WHERE name ILIKE '%Jueves%Pista 2%'
  AND is_active = true
ORDER BY created_at DESC;

-- 3. Find Paula's class_participant record for this class
SELECT
  'Paula Class Participant' as query_name,
  cp.id as participant_id,
  cp.class_id,
  cp.student_enrollment_id,
  se.full_name as student_name,
  pc.name as class_name,
  cp.status,
  cp.is_substitute,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.confirmed_by_trainer,
  cp.created_at
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.full_name ILIKE '%Paula Padilla%'
  AND pc.name ILIKE '%Jueves%Pista 2%'
  AND pc.is_active = true
ORDER BY cp.created_at DESC;

-- 4. Find attendance confirmations for Paula on 2025-12-04
SELECT
  'Paula Attendance Confirmations for 2025-12-04' as query_name,
  ac.id as confirmation_id,
  ac.class_participant_id,
  ac.scheduled_date,
  ac.attendance_confirmed,
  ac.attendance_confirmed_at,
  ac.absence_confirmed,
  ac.absence_confirmed_at,
  ac.absence_reason,
  ac.confirmed_by_trainer,
  ac.created_at,
  ac.updated_at,
  se.full_name as student_name,
  pc.name as class_name
FROM attendance_confirmations ac
JOIN class_participants cp ON ac.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.full_name ILIKE '%Paula Padilla%'
  AND ac.scheduled_date = '2025-12-04'
ORDER BY ac.created_at DESC;

-- 5. All attendance confirmations for Paula (any date)
SELECT
  'All Paula Attendance Confirmations' as query_name,
  ac.id as confirmation_id,
  ac.class_participant_id,
  ac.scheduled_date,
  ac.attendance_confirmed,
  ac.attendance_confirmed_at,
  ac.absence_confirmed,
  ac.absence_confirmed_at,
  ac.absence_reason,
  ac.confirmed_by_trainer,
  ac.created_at,
  ac.updated_at,
  se.full_name as student_name,
  pc.name as class_name
FROM attendance_confirmations ac
JOIN class_participants cp ON ac.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.full_name ILIKE '%Paula Padilla%'
ORDER BY ac.scheduled_date DESC, ac.created_at DESC;

-- 6. All participants in "Jueves - Pista 2" class
SELECT
  'All Participants in Jueves - Pista 2' as query_name,
  cp.id as participant_id,
  se.full_name as student_name,
  cp.status,
  cp.is_substitute,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.created_at
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE pc.name ILIKE '%Jueves%Pista 2%'
  AND pc.is_active = true
ORDER BY se.full_name;

-- 7. Attendance confirmations for all participants on 2025-12-04 for "Jueves - Pista 2"
SELECT
  'All Confirmations for Jueves - Pista 2 on 2025-12-04' as query_name,
  ac.id as confirmation_id,
  se.full_name as student_name,
  ac.scheduled_date,
  ac.attendance_confirmed,
  ac.attendance_confirmed_at,
  ac.absence_confirmed,
  ac.absence_confirmed_at,
  ac.absence_reason,
  ac.confirmed_by_trainer,
  cp.is_substitute,
  ac.created_at,
  ac.updated_at
FROM attendance_confirmations ac
JOIN class_participants cp ON ac.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE pc.name ILIKE '%Jueves%Pista 2%'
  AND pc.is_active = true
  AND ac.scheduled_date = '2025-12-04'
ORDER BY se.full_name;
