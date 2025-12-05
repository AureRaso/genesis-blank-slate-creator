-- Debug specific class: Jueves - Pista 2 at 19:00 on 2025-12-04

-- 1. Find the specific class for 2025-12-04 at 19:00
SELECT
  'Class for 2025-12-04 at 19:00' as query_name,
  id,
  name,
  start_time,
  start_date,
  end_date,
  max_participants,
  is_active
FROM programmed_classes
WHERE name = 'Jueves - Pista 2'
  AND start_time = '19:00:00'
  AND start_date = '2025-12-04'
  AND end_date = '2025-12-04'
  AND is_active = true;

-- 2. Find all participants for this specific class
SELECT
  'All Participants for this class' as query_name,
  cp.id as participant_id,
  cp.class_id,
  se.full_name as student_name,
  se.email,
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
WHERE cp.class_id = '515c21cf-1557-4d74-bc2e-1f5160aaf865'
ORDER BY se.full_name;

-- 3. Find attendance confirmations for this class on 2025-12-04
SELECT
  'Attendance Confirmations for 2025-12-04' as query_name,
  ac.id as confirmation_id,
  cp.id as participant_id,
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
WHERE cp.class_id = '515c21cf-1557-4d74-bc2e-1f5160aaf865'
  AND ac.scheduled_date = '2025-12-04'
ORDER BY se.full_name;

-- 4. Check if Paula is in this specific class
SELECT
  'Paula in this specific class' as query_name,
  cp.id as participant_id,
  cp.class_id,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_time,
  pc.start_date,
  cp.status,
  cp.is_substitute,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.attendance_confirmed_for_date,
  cp.created_at
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.class_id = '515c21cf-1557-4d74-bc2e-1f5160aaf865'
  AND se.full_name ILIKE '%Paula Padilla%';

-- 5. Find Paula's attendance confirmation for 2025-12-04 in this class
SELECT
  'Paula attendance confirmation for 2025-12-04' as query_name,
  ac.id as confirmation_id,
  cp.id as participant_id,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_time,
  ac.scheduled_date,
  ac.attendance_confirmed,
  ac.attendance_confirmed_at,
  ac.absence_confirmed,
  ac.absence_confirmed_at,
  ac.absence_reason,
  ac.confirmed_by_trainer,
  ac.created_at,
  ac.updated_at
FROM attendance_confirmations ac
JOIN class_participants cp ON ac.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.class_id = '515c21cf-1557-4d74-bc2e-1f5160aaf865'
  AND se.full_name ILIKE '%Paula Padilla%'
  AND ac.scheduled_date = '2025-12-04';
