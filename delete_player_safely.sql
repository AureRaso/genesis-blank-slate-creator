-- SQL para eliminar un jugador de forma segura
-- IMPORTANTE: Ejecuta esto en tu Supabase SQL Editor

-- PASO 1: Identificar el jugador
-- Reemplaza 'EMAIL_DEL_JUGADOR' con el email del jugador que quieres eliminar
-- Ejemplo: 'jugador@example.com'

-- Ver información del jugador
SELECT
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role
FROM profiles p
WHERE p.email = 'EMAIL_DEL_JUGADOR';

-- PASO 2: Obtener el student_enrollment_id del jugador
SELECT
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.club_id,
  se.status
FROM student_enrollments se
WHERE se.email = 'EMAIL_DEL_JUGADOR';

-- PASO 3: ELIMINAR EN ORDEN (para evitar errores de foreign key)

-- 3.1. Eliminar de class_waitlist
DELETE FROM class_waitlist
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'EMAIL_DEL_JUGADOR'
);

-- 3.2. Eliminar de class_participants
DELETE FROM class_participants
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'EMAIL_DEL_JUGADOR'
);

-- 3.3. Eliminar de league_enrollments
DELETE FROM league_enrollments
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'EMAIL_DEL_JUGADOR'
);

-- 3.4. Eliminar de payment_records
DELETE FROM payment_records
WHERE student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'EMAIL_DEL_JUGADOR'
);

-- 3.5. Eliminar de student_enrollments (pero CONSERVAR los que este usuario creó)
-- Solo eliminamos el enrollment del jugador, no los que él creó como admin
DELETE FROM student_enrollments
WHERE email = 'EMAIL_DEL_JUGADOR';

-- 3.6. Finalmente, eliminar el perfil de auth.users y profiles
-- NOTA: Esto también eliminará la sesión del usuario
DELETE FROM auth.users
WHERE email = 'EMAIL_DEL_JUGADOR';

-- El perfil en 'profiles' se eliminará automáticamente por CASCADE

-- PASO 4: Verificar que se eliminó correctamente
SELECT COUNT(*) as enrollments_remaining
FROM student_enrollments
WHERE email = 'EMAIL_DEL_JUGADOR';

SELECT COUNT(*) as profiles_remaining
FROM profiles
WHERE email = 'EMAIL_DEL_JUGADOR';

-- ALTERNATIVA: Si quieres MANTENER el historial pero DESACTIVAR al jugador
-- En lugar de eliminar, puedes desactivar:

/*
UPDATE student_enrollments
SET status = 'inactive'
WHERE email = 'EMAIL_DEL_JUGADOR';

UPDATE profiles
SET role = 'inactive'
WHERE email = 'EMAIL_DEL_JUGADOR';
*/

-- NOTAS IMPORTANTES:
-- 1. Reemplaza 'EMAIL_DEL_JUGADOR' en TODAS las líneas donde aparezca
-- 2. Esta operación es IRREVERSIBLE
-- 3. Se eliminarán TODOS los registros del jugador: clases, pagos, participaciones, etc.
-- 4. Si el jugador creó otros enrollments como admin, ESOS SE MANTENDRÁN
-- 5. Considera usar la alternativa de desactivación si quieres mantener el historial
