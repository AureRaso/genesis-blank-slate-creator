-- Investigar las clases del alumno gal@vmi.com

-- 1. Ver el estudiante
SELECT id, email, full_name, phone
FROM student_enrollments
WHERE email = 'gal@vmi.com';

-- 2. Ver TODAS las participaciones activas de este estudiante
SELECT
    cp.id as participation_id,
    cp.class_id,
    cp.status,
    cp.attendance_confirmed_at,
    cp.absence_confirmed,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    pc.is_active,
    pc.club_id
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND cp.status = 'active'
ORDER BY pc.name, pc.start_time;

-- 3. Ver cuántas clases tiene para el sábado específicamente
SELECT
    cp.id as participation_id,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    'sabado' = ANY(pc.days_of_week) as tiene_sabado
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND cp.status = 'active'
    AND pc.is_active = true
    AND ('sabado' = ANY(pc.days_of_week) OR 'sábado' = ANY(pc.days_of_week))
ORDER BY pc.start_time;

-- 4. Ver si hay clases duplicadas
SELECT
    pc.name,
    pc.start_time,
    COUNT(*) as cantidad_participaciones
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND cp.status = 'active'
GROUP BY pc.name, pc.start_time
HAVING COUNT(*) > 1;
