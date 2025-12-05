-- Investigar la clase Aaa que aparece en el recordatorio

-- 1. Ver los datos de la clase Aaa
SELECT
    id,
    name,
    start_time,
    duration_minutes,
    court_number,
    days_of_week,
    start_date,
    end_date,
    is_active
FROM programmed_classes
WHERE name = 'Aaa';

-- 2. Ver las participaciones del alumno gal@vmi.com en la clase Aaa
SELECT
    cp.id as participation_id,
    cp.class_id,
    cp.status,
    cp.attendance_confirmed_at,
    cp.absence_confirmed,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    pc.start_date,
    pc.end_date,
    pc.is_active
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND pc.name = 'Aaa';

-- 3. Ver TODAS las clases del alumno que tienen fecha de fin en el pasado
SELECT
    cp.id as participation_id,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    pc.start_date,
    pc.end_date,
    pc.is_active,
    CASE
        WHEN pc.end_date < CURRENT_DATE THEN 'EXPIRADA'
        ELSE 'ACTIVA'
    END as estado
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND cp.status = 'active'
ORDER BY pc.end_date;

-- 4. Fecha de hoy y mañana para referencia
SELECT
    CURRENT_DATE as hoy,
    CURRENT_DATE + INTERVAL '1 day' as manana;
