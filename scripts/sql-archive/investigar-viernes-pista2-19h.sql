-- Investigar clase Viernes - Pista 2 a las 19:00 en Hespérides
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610
-- Fecha: 2025-01-17 (mañana viernes)

-- 1. Encontrar la clase
SELECT 
  pc.id as class_id,
  pc.name,
  pc.start_time::text,
  pc.max_participants,
  c.name as club_name
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
WHERE pc.name ILIKE '%Viernes%Pista 2%'
  AND pc.start_time = '19:00:00'
  AND pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- 2. Participantes activos de esa clase
SELECT 
  cp.id,
  se.full_name,
  cp.status,
  cp.is_substitute,
  cp.absence_confirmed,
  cp.joined_from_waitlist_at::text,
  cp.created_at::text
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE cp.class_id IN (
  SELECT pc.id FROM programmed_classes pc
  WHERE pc.name ILIKE '%Viernes%Pista 2%'
    AND pc.start_time = '19:00:00'
    AND pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
)
AND cp.status = 'active'
ORDER BY cp.created_at;

-- 3. Waitlist para esta clase mañana (2025-01-17)
SELECT 
  cw.id as waitlist_id,
  se.full_name,
  se.email,
  se.phone,
  cw.status,
  cw.class_date::text,
  cw.requested_at::text,
  cw.accepted_at::text,
  cw.rejected_at::text
FROM class_waitlist cw
JOIN student_enrollments se ON se.id = cw.student_enrollment_id
WHERE cw.class_id IN (
  SELECT pc.id FROM programmed_classes pc
  WHERE pc.name ILIKE '%Viernes%Pista 2%'
    AND pc.start_time = '19:00:00'
    AND pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
)
AND cw.class_date = '2025-01-17'
ORDER BY cw.requested_at;

-- 4. Verificar confirmaciones de asistencia para mañana
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
  WHERE pc.name ILIKE '%Viernes%Pista 2%'
    AND pc.start_time = '19:00:00'
    AND pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
)
AND cac.attendance_confirmed_for_date = '2025-01-17'
ORDER BY cac.created_at;

-- 5. Buscar a Victor Pozo específicamente
SELECT 
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.phone
FROM student_enrollments se
WHERE se.full_name ILIKE '%Victor%Pozo%'
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- 6. Buscar a Pedro Bernal específicamente
SELECT 
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.phone
FROM student_enrollments se
WHERE se.full_name ILIKE '%Pedro%Bernal%'
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
