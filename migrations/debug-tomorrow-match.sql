-- Debug: Ver exactamente qué está buscando la función vs qué hay en la BD

-- 1. ¿Qué día es mañana según PostgreSQL?
SELECT
    CURRENT_DATE as hoy,
    CURRENT_DATE + INTERVAL '1 day' as manana,
    EXTRACT(DOW FROM CURRENT_DATE + INTERVAL '1 day') as dia_numero_manana,
    CASE EXTRACT(DOW FROM CURRENT_DATE + INTERVAL '1 day')
        WHEN 0 THEN 'domingo'
        WHEN 1 THEN 'lunes'
        WHEN 2 THEN 'martes'
        WHEN 3 THEN 'miércoles'
        WHEN 4 THEN 'jueves'
        WHEN 5 THEN 'viernes'
        WHEN 6 THEN 'sábado'
    END as dia_nombre_esperado;

-- 2. Ver todas las clases del club Gali con sus días
SELECT
    id,
    name,
    start_time,
    days_of_week,
    -- Verificar si contiene 'sábado' (con acento)
    'sábado' = ANY(days_of_week) as contiene_sabado_con_acento,
    -- Verificar si contiene 'sabado' (sin acento)
    'sabado' = ANY(days_of_week) as contiene_sabado_sin_acento,
    -- Mostrar el array completo
    array_to_string(days_of_week, ', ') as dias_como_texto
FROM programmed_classes
WHERE club_id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d'
    AND is_active = true;

-- 3. Ver participantes para gal@vmi.com
SELECT
    se.email,
    se.id as student_id,
    cp.id as participation_id,
    cp.class_id,
    pc.name as class_name,
    pc.days_of_week,
    'sábado' = ANY(pc.days_of_week) as match_sabado
FROM student_enrollments se
JOIN class_participants cp ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'gal@vmi.com'
    AND cp.status = 'active'
    AND pc.is_active = true;
