-- Investigar usuarios mark y mark20
-- Ver todos los datos relacionados con estos usuarios

-- 1. Ver datos en student_enrollments
SELECT
  'student_enrollments' as table_name,
  id,
  email,
  full_name,
  phone,
  level,
  club_id,
  created_at,
  updated_at
FROM student_enrollments
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')
ORDER BY email;

-- 2. Ver si hay datos en auth.users (user_metadata)
SELECT
  'auth.users' as table_name,
  id,
  email,
  raw_user_meta_data->>'phone' as phone_from_metadata,
  raw_user_meta_data->>'full_name' as full_name_from_metadata,
  raw_user_meta_data as all_metadata,
  created_at
FROM auth.users
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')
ORDER BY email;

-- 3. Ver si hay otras tablas con información de teléfono
-- (students, profiles, etc.)
SELECT
  'students (si existe)' as table_name,
  *
FROM students
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')
ORDER BY email;

-- 4. Buscar en profiles si existe
SELECT
  'profiles (si existe)' as table_name,
  *
FROM profiles
WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')
  OR id IN (
    SELECT id FROM auth.users
    WHERE email IN ('mark@gmail.com', 'mark20@gmail.com')
  )
ORDER BY email;

-- 5. Ver todas las tablas que contengan estos emails
-- Esto nos ayudará a encontrar dónde más están almacenados
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname IN ('public', 'auth')
ORDER BY tablename;
