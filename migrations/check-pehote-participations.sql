-- Investigar las clases del alumno pehote8074@gusronk.com

-- 1. Ver el estudiante
SELECT id, email, full_name, phone
FROM student_enrollments
WHERE email = 'pehote8074@gusronk.com';

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
    pc.is_active
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'pehote8074@gusronk.com'
    AND cp.status = 'active'
ORDER BY pc.name, pc.start_time;

-- 3. Ver cuántas participaciones tiene para el lunes
SELECT
    cp.id as participation_id,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'pehote8074@gusronk.com'
    AND cp.status = 'active'
    AND pc.is_active = true
    AND 'lunes' = ANY(pc.days_of_week)
ORDER BY pc.start_time;

-- 4. Comparar: ¿tienen los mismos class_id los dos alumnos?
SELECT
    'gal@vmi.com' as alumno,
    cp.class_id,
    pc.name
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND cp.status = 'active'
    AND pc.is_active = true
    AND 'lunes' = ANY(pc.days_of_week)

UNION ALL

SELECT
    'pehote8074@gusronk.com' as alumno,
    cp.class_id,
    pc.name
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'pehote8074@gusronk.com'
    AND cp.status = 'active'
    AND pc.is_active = true
    AND 'lunes' = ANY(pc.days_of_week)
ORDER BY alumno, class_id;
