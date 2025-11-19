-- =====================================================
-- Fix: Auto-confirmar TODAS las clases de KM Pádel
-- Club: KM Pádel (a66741f0-7ac3-4c1b-a7ca-5601959527aa)
-- Sin restricción de fecha de inicio
-- =====================================================

-- PREVIEW: Ver todas las clases del club
SELECT
  pc.id,
  pc.name,
  pc.start_date,
  pc.end_date,
  COUNT(cp.id) as total_participants,
  COUNT(CASE WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN 1 END) as confirmed,
  COUNT(CASE WHEN cp.attendance_confirmed_for_date IS NULL THEN 1 END) as not_confirmed
FROM programmed_classes pc
LEFT JOIN class_participants cp ON cp.class_id = pc.id AND cp.status = 'active'
WHERE pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.is_active = true
GROUP BY pc.id, pc.name, pc.start_date, pc.end_date
ORDER BY pc.start_date;

-- PREVIEW: Ver participantes que se van a actualizar
SELECT
  cp.id,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date,
  cp.attendance_confirmed_for_date
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.is_active = true
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false)
ORDER BY pc.start_date, pc.name, se.full_name;

-- Contar total a actualizar
SELECT COUNT(*) as total_to_update
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.is_active = true
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- EXECUTE: Auto-confirmar TODOS los participantes
BEGIN;

UPDATE class_participants cp
SET
  attendance_confirmed_for_date = pc.start_date,
  attendance_confirmed_at = NOW(),
  confirmed_by_trainer = false
FROM programmed_classes pc
WHERE cp.class_id = pc.id
  AND pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.is_active = true
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- VERIFY: Ver clases después de la actualización
SELECT
  pc.id,
  pc.name,
  pc.start_date,
  COUNT(cp.id) as total_participants,
  COUNT(CASE WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN 1 END) as confirmed,
  COUNT(CASE WHEN cp.attendance_confirmed_for_date IS NULL THEN 1 END) as not_confirmed
FROM programmed_classes pc
LEFT JOIN class_participants cp ON cp.class_id = pc.id AND cp.status = 'active'
WHERE pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.is_active = true
GROUP BY pc.id, pc.name, pc.start_date
ORDER BY pc.start_date;

-- Ver participantes recién actualizados
SELECT
  cp.id,
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.confirmed_by_trainer
FROM class_participants cp
INNER JOIN programmed_classes pc ON pc.id = cp.class_id
INNER JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.is_active = true
  AND cp.status = 'active'
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '2 minutes'
ORDER BY pc.start_date, pc.name, se.full_name;

COMMIT;
