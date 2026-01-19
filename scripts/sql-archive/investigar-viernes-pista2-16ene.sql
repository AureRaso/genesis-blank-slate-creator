-- Investigar waitlist de Viernes - Pista 2 para HOY 2026-01-16
-- Club: Hespérides Padel

-- 1. Buscar todas las entradas de waitlist para hoy en cualquier clase "Viernes - Pista 2"
SELECT 
  cw.id as waitlist_id,
  cw.class_id,
  se.full_name,
  se.email,
  cw.status,
  cw.class_date::text,
  cw.requested_at::text,
  cw.accepted_at::text,
  cw.rejected_at::text
FROM class_waitlist cw
JOIN student_enrollments se ON se.id = cw.student_enrollment_id
WHERE cw.class_date = '2026-01-16'
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY cw.requested_at;

-- 2. Buscar específicamente a Victor Pozo en waitlist
SELECT 
  cw.id as waitlist_id,
  cw.class_id,
  pc.name as class_name,
  cw.status,
  cw.class_date::text,
  cw.requested_at::text,
  cw.accepted_at::text,
  cw.rejected_at::text
FROM class_waitlist cw
JOIN student_enrollments se ON se.id = cw.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cw.class_id
WHERE se.full_name ILIKE '%victor%pozo%'
ORDER BY cw.requested_at DESC;

-- 3. Buscar a Pedro Bernal en waitlist
SELECT 
  cw.id as waitlist_id,
  cw.class_id,
  pc.name as class_name,
  cw.status,
  cw.class_date::text,
  cw.requested_at::text,
  cw.accepted_at::text,
  cw.rejected_at::text
FROM class_waitlist cw
JOIN student_enrollments se ON se.id = cw.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cw.class_id
WHERE se.full_name ILIKE '%pedro%bernal%'
ORDER BY cw.requested_at DESC;

-- 4. Buscar participante Pedro Bernal que entró hoy como sustituto
SELECT 
  cp.id,
  cp.class_id,
  pc.name as class_name,
  se.full_name,
  cp.is_substitute,
  cp.joined_from_waitlist_at::text,
  cp.created_at::text
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.full_name ILIKE '%pedro%bernal%'
  AND cp.joined_from_waitlist_at IS NOT NULL
  AND cp.joined_from_waitlist_at::date = '2026-01-16'
ORDER BY cp.created_at DESC;
