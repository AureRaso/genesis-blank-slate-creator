-- Script para actualizar student_enrollments y añadir student_profile_id
-- donde el email coincida con un perfil existente

-- PASO 1: Actualizar enrollments de hijos que tienen email de tipo child.*.@temp.padelock.com
UPDATE student_enrollments se
SET student_profile_id = p.id
FROM profiles p
WHERE se.email = p.email
  AND se.student_profile_id IS NULL
  AND p.email LIKE 'child.%@temp.padelock.com';

-- PASO 2: Verificar el resultado para la clase TestNiños
SELECT
  cp.id as participant_id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.status,
  se.email as enrollment_email,
  se.full_name as enrollment_name,
  se.student_profile_id,
  pc.name as class_name,
  p.full_name as profile_name
FROM class_participants cp
LEFT JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
LEFT JOIN profiles p ON se.student_profile_id = p.id
WHERE pc.name LIKE '%Niños%' OR pc.name LIKE '%TestNiños%';

-- PASO 3: Verificar todos los enrollments actualizados
SELECT
  se.id,
  se.email,
  se.full_name,
  se.student_profile_id,
  p.full_name as profile_name,
  p.role as profile_role
FROM student_enrollments se
LEFT JOIN profiles p ON se.student_profile_id = p.id
WHERE se.email LIKE 'child.%@temp.padelock.com'
ORDER BY se.created_at DESC;
