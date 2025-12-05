-- Verificar las ausencias del jugador ff en class_attendance_confirmations
-- Jugador: ff (student_enrollment_id: 99206cc1-e7e4-4b02-b9c4-a0fddf724a04)
-- Clase: Asdff (class_id: 55b885c4-31a6-469b-a3a5-fc39336105ec)
-- Participant ID: 736eddfc-3ca6-4068-b13b-a9da261617f9

-- 1. Ver el registro en class_participants
SELECT
  'class_participants record' as query_name,
  cp.id as participant_id,
  se.full_name as student_name,
  pc.name as class_name,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.attendance_confirmed_for_date,
  cp.created_at,
  cp.updated_at
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.id = '736eddfc-3ca6-4068-b13b-a9da261617f9';

-- 2. Ver TODOS los registros en class_attendance_confirmations para este participante
SELECT
  'class_attendance_confirmations records' as query_name,
  ac.id,
  ac.scheduled_date,
  ac.attendance_confirmed,
  ac.attendance_confirmed_at,
  ac.absence_confirmed,
  ac.absence_reason,
  ac.absence_confirmed_at,
  ac.confirmed_by_trainer,
  ac.absence_locked,
  ac.created_at,
  ac.updated_at,
  se.full_name as student_name,
  pc.name as class_name
FROM class_attendance_confirmations ac
JOIN class_participants cp ON ac.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE ac.class_participant_id = '736eddfc-3ca6-4068-b13b-a9da261617f9'
ORDER BY ac.scheduled_date DESC;

-- 3. Específicamente para las fechas de la clase (2025-12-05 a 2025-12-13)
SELECT
  'Confirmations for class dates (2025-12-05 to 2025-12-13)' as query_name,
  ac.id,
  ac.scheduled_date,
  ac.attendance_confirmed,
  ac.absence_confirmed,
  ac.absence_reason,
  ac.created_at,
  ac.updated_at
FROM class_attendance_confirmations ac
WHERE ac.class_participant_id = '736eddfc-3ca6-4068-b13b-a9da261617f9'
  AND ac.scheduled_date >= '2025-12-05'
  AND ac.scheduled_date <= '2025-12-13'
ORDER BY ac.scheduled_date;
