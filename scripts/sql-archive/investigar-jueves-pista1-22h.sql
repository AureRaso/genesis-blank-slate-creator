-- Investigar clase Jueves - Pista 1 a las 22:00 en Hespérides
-- Fecha: 2025-01-16 (mañana jueves)

-- 1. Encontrar la clase
SELECT 
  pc.id as class_id,
  pc.name,
  pc.start_time::text,
  pc.max_students,
  c.name as club_name
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
WHERE pc.name ILIKE '%Jueves%Pista 1%'
  AND pc.start_time = '22:00:00'
  AND c.name ILIKE '%Hespérides%';

-- 2. Participantes activos de esa clase
SELECT 
  cp.id,
  se.full_name,
  cp.status,
  cp.absence_confirmed,
  cp.joined_from_waitlist_at::text,
  cp.created_at::text
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE cp.class_id IN (
  SELECT pc.id FROM programmed_classes pc
  JOIN clubs c ON c.id = pc.club_id
  WHERE pc.name ILIKE '%Jueves%Pista 1%'
    AND pc.start_time = '22:00:00'
    AND c.name ILIKE '%Hespérides%'
)
AND cp.status = 'active'
ORDER BY cp.created_at;

-- 3. Confirmaciones de asistencia para mañana (2025-01-16)
SELECT 
  cac.id,
  se.full_name,
  cac.attendance_confirmed_for_date::text,
  cac.absence_confirmed,
  cac.created_at::text
FROM class_attendance_confirmations cac
JOIN class_participants cp ON cp.id = cac.class_participant_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE cp.class_id IN (
  SELECT pc.id FROM programmed_classes pc
  JOIN clubs c ON c.id = pc.club_id
  WHERE pc.name ILIKE '%Jueves%Pista 1%'
    AND pc.start_time = '22:00:00'
    AND c.name ILIKE '%Hespérides%'
)
AND cac.attendance_confirmed_for_date = '2025-01-16'
ORDER BY cac.created_at;

-- 4. Waitlist para esta clase mañana
SELECT 
  cw.id as waitlist_id,
  se.full_name,
  cw.status,
  cw.class_date::text,
  cw.requested_at::text,
  cw.accepted_at::text,
  cw.rejected_at::text
FROM class_waitlist cw
JOIN student_enrollments se ON se.id = cw.student_enrollment_id
WHERE cw.class_id IN (
  SELECT pc.id FROM programmed_classes pc
  JOIN clubs c ON c.id = pc.club_id
  WHERE pc.name ILIKE '%Jueves%Pista 1%'
    AND pc.start_time = '22:00:00'
    AND c.name ILIKE '%Hespérides%'
)
AND cw.class_date = '2025-01-16'
ORDER BY cw.requested_at;
