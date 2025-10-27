-- Script para eliminar alumnos de prueba del club Hespérides
-- CUIDADO: Esta operación es IRREVERSIBLE

-- 1. Ver todos los alumnos del club Hespérides para confirmar cuáles eliminar
SELECT
  se.id as enrollment_id,
  se.email,
  se.full_name,
  se.level,
  se.status,
  se.created_at,
  p.id as profile_id
FROM student_enrollments se
LEFT JOIN profiles p ON p.email = se.email
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY se.created_at DESC;

-- 2. OPCIÓN A: Eliminar UN alumno específico por email
-- Reemplaza 'EMAIL_DEL_ALUMNO' con el email real

-- Paso 1: Eliminar de class_waitlist
DELETE FROM class_waitlist
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
);

-- Paso 2: Eliminar de class_participants
DELETE FROM class_participants
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
);

-- Paso 3: Eliminar de league_enrollments
DELETE FROM league_enrollments
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
);

-- Paso 4: Eliminar de payment_records
DELETE FROM payment_records
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'merinainfo1@gmail.com'
);

-- Paso 5: Eliminar el enrollment
DELETE FROM student_enrollments
WHERE email = 'merinainfo1@gmail.com';

-- Paso 6: Eliminar el perfil
DELETE FROM profiles
WHERE email = 'merinainfo1@gmail.com';

-- 3. OPCIÓN B: Eliminar TODOS los alumnos de prueba creados HOY
-- CUIDADO: Esto eliminará TODOS los alumnos creados hoy en Hespérides

/*
-- Eliminar waitlist
DELETE FROM class_waitlist
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND created_at >= CURRENT_DATE
);

-- Eliminar participaciones
DELETE FROM class_participants
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND created_at >= CURRENT_DATE
);

-- Eliminar ligas
DELETE FROM league_enrollments
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND created_at >= CURRENT_DATE
);

-- Eliminar pagos
DELETE FROM payment_records
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND created_at >= CURRENT_DATE
);

-- Eliminar enrollments
DELETE FROM student_enrollments
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
AND created_at >= CURRENT_DATE;

-- Eliminar perfiles (solo jugadores creados hoy)
DELETE FROM profiles
WHERE role = 'player'
AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
AND created_at >= CURRENT_DATE;
*/

-- 4. Verificar que se eliminaron
SELECT COUNT(*) as alumnos_restantes
FROM student_enrollments
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
