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
  se.student_profile_id,
  se.created_at
FROM student_enrollments se
WHERE se.email LIKE 'child.%@temp.padelock.com'
ORDER BY se.created_at DESC;

-- 3. Ver la clase "TestNiños" y sus participantes
SELECT
  pc.id as class_id,
  pc.name as class_name,
  se.id as enrollment_id,
  se.email as enrollment_email,
  se.full_name as enrollment_name,
  se.student_profile_id,
  cp.id as participant_id,
  cp.status
FROM programmed_classes pc
LEFT JOIN class_participants cp ON cp.class_id = pc.id
LEFT JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE pc.name LIKE '%Niños%' OR pc.name LIKE '%TestNiños%'
ORDER BY pc.created_at DESC;

-- 4. Buscar cualquier enrollment que pueda estar relacionado con "Hijo2"
SELECT
  se.id,
  se.email,
  se.full_name,
  se.student_profile_id,
  se.trainer_profile_id,
  p.full_name as trainer_name
FROM student_enrollments se
LEFT JOIN profiles p ON se.trainer_profile_id = p.id
WHERE se.full_name LIKE '%Hijo%' OR se.full_name LIKE '%Maria%'
ORDER BY se.created_at DESC
LIMIT 20;

-- 5. Ver class_participants de la clase TestNiños
SELECT
  cp.id as participant_id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.status,
  se.email as enrollment_email,
  se.full_name as enrollment_name,
  se.student_profile_id,
  pc.name as class_name
FROM class_participants cp
LEFT JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE pc.name LIKE '%Niños%' OR pc.name LIKE '%TestNiños%';
