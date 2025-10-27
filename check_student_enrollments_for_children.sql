-- Verificar student_enrollments para los hijos de madre@gmail.com

-- 1. Ver los hijos de madre@gmail.com
SELECT
  p.id,
  p.email,
  p.full_name,
  p.level,
  p.role
FROM profiles p
WHERE p.email LIKE 'child.%@temp.padelock.com'
AND p.id IN (
  SELECT dependent_profile_id
  FROM account_dependents
  WHERE guardian_profile_id = (
    SELECT id FROM profiles WHERE email = 'madre@gmail.com'
  )
)
ORDER BY p.created_at;

-- 2. Ver todos los student_enrollments con emails similares
SELECT
  se.id,
  se.email,
  se.full_name,
  se.class_id,
  se.created_at,
  pc.name as class_name
FROM student_enrollments se
LEFT JOIN programmed_classes pc ON se.class_id = pc.id
WHERE se.email LIKE 'child.%@temp.padelock.com'
ORDER BY se.created_at DESC;

-- 3. Ver la clase "TestNiños" y sus participantes
SELECT
  pc.id as class_id,
  pc.name as class_name,
  se.id as enrollment_id,
  se.email,
  se.full_name,
  cp.id as participant_id,
  cp.status
FROM programmed_classes pc
LEFT JOIN student_enrollments se ON se.class_id = pc.id
LEFT JOIN class_participants cp ON cp.student_enrollment_id = se.id
WHERE pc.name LIKE '%Niños%' OR pc.name LIKE '%TestNiños%'
ORDER BY pc.created_at DESC;

-- 4. Buscar cualquier enrollment que pueda estar relacionado con "Hijo2"
SELECT
  se.id,
  se.email,
  se.full_name,
  se.class_id,
  pc.name as class_name
FROM student_enrollments se
LEFT JOIN programmed_classes pc ON se.class_id = pc.id
WHERE se.full_name LIKE '%Hijo%' OR se.full_name LIKE '%Maria%'
ORDER BY se.created_at DESC
LIMIT 20;
