-- Debug script para verificar la consulta de asistencia
-- Usuario: Juan Pérez García
-- ID: 1cfc141c-401c-49ba-bdfe-c03f5042b6c7

-- 1. Verificar que el usuario existe y tiene participaciones en clases
SELECT
  cp.id,
  cp.class_id,
  cp.student_profile_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  p.full_name as student_name
FROM class_participants cp
JOIN profiles p ON p.id = cp.student_profile_id
WHERE cp.student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
ORDER BY cp.created_at DESC;

-- 2. Verificar las clases programadas relacionadas
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.duration_minutes,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.trainer_profile_id,
  pc.club_id
FROM programmed_classes pc
WHERE pc.id IN (
  SELECT class_id
  FROM class_participants
  WHERE student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
);

-- 3. Join completo para ver la data combinada
SELECT
  cp.id,
  cp.class_id,
  cp.student_profile_id,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  pc.id as programmed_class_id,
  pc.name as class_name,
  pc.start_time,
  pc.duration_minutes,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  trainer.full_name as trainer_name,
  club.name as club_name
FROM class_participants cp
LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
LEFT JOIN profiles trainer ON trainer.id = pc.trainer_profile_id
LEFT JOIN clubs club ON club.id = pc.club_id
WHERE cp.student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
  AND cp.status = 'active';

-- 4. Verificar permisos RLS (Row Level Security)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('class_participants', 'programmed_classes')
ORDER BY tablename, policyname;

-- 5. Verificar clases de hoy (lunes, 2025-10-06)
SELECT
  cp.id,
  pc.name,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  CASE
    WHEN 'lunes' = ANY(pc.days_of_week) THEN 'SÍ tiene clase hoy'
    ELSE 'NO tiene clase hoy'
  END as tiene_clase_hoy,
  CASE
    WHEN CURRENT_DATE BETWEEN pc.start_date AND pc.end_date THEN 'Dentro del rango de fechas'
    ELSE 'Fuera del rango de fechas'
  END as rango_fechas
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE cp.student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
  AND cp.status = 'active';
