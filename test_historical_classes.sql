-- Test SQL para verificar clases pasadas del jugador mark0@gmail.com
-- User ID: d7a0172f-83b4-46b3-9647-d01821fc670a

-- PASO 1: Obtener los enrollment IDs del jugador
SELECT
    id as enrollment_id,
    email,
    full_name,
    student_profile_id
FROM student_enrollments
WHERE student_profile_id = 'd7a0172f-83b4-46b3-9647-d01821fc670a'
   OR email = 'mark0@gmail.com';

-- PASO 2: Verificar la estructura de class_participants
SELECT *
FROM class_participants
LIMIT 1;

-- PASO 3: Obtener TODAS las clases del jugador
WITH user_enrollments AS (
    SELECT id as enrollment_id
    FROM student_enrollments
    WHERE student_profile_id = 'd7a0172f-83b4-46b3-9647-d01821fc670a'
       OR email = 'mark0@gmail.com'
)
SELECT
    cp.id as participant_id,
    cp.student_enrollment_id,
    cp.class_id,
    cp.status,
    cp.created_at,
    pc.id as programmed_class_id,
    pc.name as class_name,
    pc.start_date,
    pc.end_date,
    pc.start_time,
    CASE
        WHEN pc.end_date < CURRENT_DATE THEN 'PASADA'
        WHEN pc.start_date <= CURRENT_DATE AND pc.end_date >= CURRENT_DATE THEN 'ACTUAL'
        ELSE 'FUTURA'
    END as class_status
FROM class_participants cp
INNER JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.student_enrollment_id IN (SELECT enrollment_id FROM user_enrollments)
ORDER BY pc.start_date DESC;

-- PASO 4: Solo clases PASADAS (end_date antes de hoy)
WITH user_enrollments AS (
    SELECT id as enrollment_id
    FROM student_enrollments
    WHERE student_profile_id = 'd7a0172f-83b4-46b3-9647-d01821fc670a'
       OR email = 'mark0@gmail.com'
)
SELECT
    cp.id as participant_id,
    pc.name as class_name,
    pc.start_date,
    pc.end_date,
    pc.start_time
FROM class_participants cp
INNER JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.student_enrollment_id IN (SELECT enrollment_id FROM user_enrollments)
  AND pc.end_date < CURRENT_DATE
ORDER BY pc.end_date DESC;

-- PASO 5: Contar clases por estado
WITH user_enrollments AS (
    SELECT id as enrollment_id
    FROM student_enrollments
    WHERE student_profile_id = 'd7a0172f-83b4-46b3-9647-d01821fc670a'
       OR email = 'mark0@gmail.com'
)
SELECT
    COUNT(*) FILTER (WHERE pc.end_date < CURRENT_DATE) as clases_pasadas,
    COUNT(*) FILTER (WHERE pc.start_date <= CURRENT_DATE AND pc.end_date >= CURRENT_DATE) as clases_actuales,
    COUNT(*) FILTER (WHERE pc.start_date > CURRENT_DATE) as clases_futuras,
    COUNT(*) as total_clases
FROM class_participants cp
INNER JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.student_enrollment_id IN (SELECT enrollment_id FROM user_enrollments);
