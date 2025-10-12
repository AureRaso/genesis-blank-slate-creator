-- Script para verificar por qué Juan no tiene clases
-- Usuario: Juan Pérez García (ID: 1cfc141c-401c-49ba-bdfe-c03f5042b6c7)

-- 1. Verificar que Juan existe en la base de datos
SELECT
    id,
    email,
    full_name,
    role,
    club_id
FROM profiles
WHERE id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7';

-- 2. Verificar si hay clases programadas en el club de Juan
SELECT
    pc.id,
    pc.name,
    pc.days_of_week,
    pc.start_date,
    pc.end_date,
    pc.start_time,
    pc.duration_minutes,
    pc.club_id,
    c.name as club_name
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
WHERE pc.club_id = (
    SELECT club_id
    FROM profiles
    WHERE id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
)
AND pc.start_date <= CURRENT_DATE
AND pc.end_date >= CURRENT_DATE;

-- 3. Verificar si Juan tiene algún enrollment (inscripción)
SELECT
    e.id,
    e.student_profile_id,
    e.class_id,
    e.status,
    pc.name as class_name
FROM student_enrollments e
LEFT JOIN programmed_classes pc ON pc.id = e.class_id
WHERE e.student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7';

-- 4. Verificar si Juan está en class_participants
SELECT
    cp.id,
    cp.student_enrollment_id,
    cp.class_id,
    cp.status,
    pc.name as class_name,
    pc.days_of_week,
    se.student_profile_id
FROM class_participants cp
LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
LEFT JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
   OR cp.student_enrollment_id IN (
       SELECT id FROM student_enrollments
       WHERE student_profile_id = '1cfc141c-401c-49ba-bdfe-c03f5042b6c7'
   );

-- 5. Ver todas las class_participants para entender la estructura
SELECT
    cp.id,
    cp.student_enrollment_id,
    cp.class_id,
    cp.status,
    se.student_profile_id,
    p.full_name as student_name,
    pc.name as class_name
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN profiles p ON p.id = se.student_profile_id
LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE cp.status = 'active'
LIMIT 10;
