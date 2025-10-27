-- SQL para DESACTIVAR un jugador (mantener historial)
-- IMPORTANTE: Ejecuta esto en tu Supabase SQL Editor

-- Reemplaza 'EMAIL_DEL_JUGADOR' con el email del jugador
-- Ejemplo: 'juan@gmail.com'

-- 1. Ver información actual del jugador
SELECT
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role,
  se.id as enrollment_id,
  se.status as enrollment_status
FROM profiles p
LEFT JOIN student_enrollments se ON se.email = p.email
WHERE p.email = 'EMAIL_DEL_JUGADOR';

-- 2. DESACTIVAR el enrollment (esto evitará que aparezca en las listas activas)
UPDATE student_enrollments
SET status = 'inactive'
WHERE email = 'EMAIL_DEL_JUGADOR';

-- 3. Opcionalmente, eliminar de clases futuras (mantener historial pasado)
-- Esto elimina participaciones en clases con fecha futura
DELETE FROM class_participants
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'EMAIL_DEL_JUGADOR'
)
AND class_id IN (
  SELECT id FROM programmed_classes WHERE end_date >= CURRENT_DATE
);

-- 4. Eliminar de listas de espera
DELETE FROM class_waitlist
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'EMAIL_DEL_JUGADOR'
);

-- 5. Verificar que se desactivó
SELECT
  se.full_name,
  se.email,
  se.status,
  se.club_id
FROM student_enrollments se
WHERE se.email = 'EMAIL_DEL_JUGADOR';

-- RESULTADO: El jugador estará desactivado pero su historial se mantendrá
-- - No aparecerá en listas de alumnos activos
-- - Se mantiene historial de pagos
-- - Se mantiene historial de asistencias pasadas
-- - Se elimina de clases futuras y listas de espera
