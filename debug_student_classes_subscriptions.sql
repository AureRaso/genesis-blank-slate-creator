-- Debug: Verificar clases asignadas para estudiantes

-- 1. Ver todos los student_enrollments
SELECT
  se.id,
  se.full_name,
  se.email,
  se.created_by_profile_id,
  p.email as profile_email
FROM student_enrollments se
LEFT JOIN auth.users u ON se.created_by_profile_id = u.id
LEFT JOIN profiles p ON se.created_by_profile_id = p.id
ORDER BY se.created_at DESC
LIMIT 10;

-- 2. Ver todas las participaciones en clases
SELECT
  cp.id,
  cp.class_id,
  cp.student_enrollment_id,
  cp.payment_status,
  cp.status,
  cp.subscription_id,
  pc.name as class_name,
  se.full_name as student_name,
  se.email as student_email
FROM class_participants cp
JOIN programmed_classes pc ON cp.class_id = pc.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 3. Ver si existe la tabla class_subscriptions
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'class_subscriptions'
) as table_exists;

-- 4. Ver suscripciones si la tabla existe
-- SELECT * FROM class_subscriptions LIMIT 5;

-- 5. Ver participaciones con joins completos (la consulta que usa el hook)
SELECT
  cp.*,
  pc.name,
  pc.monthly_price,
  c.name as club_name,
  p.full_name as trainer_name
FROM class_participants cp
JOIN programmed_classes pc ON cp.class_id = pc.id
JOIN clubs c ON pc.club_id = c.id
LEFT JOIN profiles p ON pc.trainer_profile_id = p.id
ORDER BY cp.created_at DESC
LIMIT 5;