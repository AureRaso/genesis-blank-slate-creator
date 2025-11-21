-- 1. Ver las clases del club Gali programadas para el sábado
SELECT
    id,
    name,
    start_time,
    duration_minutes,
    days_of_week,
    is_active,
    start_date,
    end_date
FROM programmed_classes
WHERE club_id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
    AND is_active = true
ORDER BY start_time;

-- 2. Ver los participantes de esas clases
SELECT
    cp.id as participation_id,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    se.email,
    se.full_name,
    se.phone,
    cp.status,
    cp.absence_confirmed
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.club_id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
    AND pc.is_active = true
    AND cp.status = 'active'
ORDER BY pc.start_time, se.email;

-- 3. Verificar específicamente el estudiante gal@vmi.com
SELECT
    se.id as student_id,
    se.email,
    se.full_name,
    se.phone,
    cp.id as participation_id,
    cp.class_id,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    cp.status
FROM student_enrollments se
LEFT JOIN class_participants cp ON cp.student_enrollment_id = se.id AND cp.status = 'active'
LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com';

-- 4. Ver qué día de la semana es mañana (sábado debería ser 'sabado' en el array)
SELECT CURRENT_DATE as hoy,
       CURRENT_DATE + INTERVAL '1 day' as manana,
       EXTRACT(DOW FROM CURRENT_DATE + INTERVAL '1 day') as dia_numero,
       CASE EXTRACT(DOW FROM CURRENT_DATE + INTERVAL '1 day')
           WHEN 0 THEN 'domingo'
           WHEN 1 THEN 'lunes'
           WHEN 2 THEN 'martes'
           WHEN 3 THEN 'miércoles'
           WHEN 4 THEN 'jueves'
           WHEN 5 THEN 'viernes'
           WHEN 6 THEN 'sábado'
       END as dia_nombre;
