-- =====================================================
-- Fix: Auto-confirmar participantes de "Partido Chicos"
-- Club: KM Pádel (a66741f0-7ac3-4c1b-a7ca-5601959527aa)
-- Clase ID: 881d5e7e-4f5d-4bdb-ab30-f67267cc2102
-- =====================================================

-- PREVIEW: Ver participantes que se van a actualizar
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
WHERE cp.class_id = '881d5e7e-4f5d-4bdb-ab30-f67267cc2102'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- EXECUTE: Auto-confirmar participantes
BEGIN;

UPDATE class_participants cp
SET
  attendance_confirmed_for_date = pc.start_date,
  attendance_confirmed_at = NOW(),
  confirmed_by_trainer = false
FROM programmed_classes pc
WHERE cp.class_id = pc.id
  AND cp.class_id = '881d5e7e-4f5d-4bdb-ab30-f67267cc2102'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NULL
  AND (cp.absence_confirmed IS NULL OR cp.absence_confirmed = false);

-- VERIFY: Ver participantes actualizados
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
WHERE cp.class_id = '881d5e7e-4f5d-4bdb-ab30-f67267cc2102'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_at >= NOW() - INTERVAL '2 minutes';

COMMIT;
