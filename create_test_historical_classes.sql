-- Script para crear clases pasadas de prueba para mark0@gmail.com
-- User ID: d7a0172f-83b4-46b3-9647-d01821fc670a

-- PASO 1: Verificar enrollment_id y datos del usuario
SELECT
    id as enrollment_id,
    email,
    full_name,
    student_profile_id
FROM student_enrollments
WHERE student_profile_id = 'd7a0172f-83b4-46b3-9647-d01821fc670a'
   OR email = 'mark0@gmail.com';

-- PASO 2: Obtener clases programadas existentes
SELECT
    id,
    name,
    start_date,
    end_date,
    start_time,
    club_id,
    trainer_profile_id
FROM programmed_classes
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- PASO 3: Crear 3 clases programadas con fechas pasadas
-- Usando los datos existentes del club y trainer
INSERT INTO programmed_classes (
    name,
    club_id,
    trainer_profile_id,
    created_by,
    start_date,
    end_date,
    start_time,
    duration_minutes,
    days_of_week,
    monthly_price,
    recurrence_type,
    is_active,
    level_from,
    level_to
) VALUES
    -- Clase 1: Octubre 2025
    (
        'Clase Historial - Octubre',
        '7b6f49ae-d496-407b-bca1-f5f1e9370610',
        '6886490f-d830-483e-b454-5c526f445f9c',
        '6886490f-d830-483e-b454-5c526f445f9c',
        '2025-10-01',
        '2025-10-15',
        '18:00:00',
        60,
        ARRAY['Monday', 'Wednesday'],
        50.00,
        'weekly',
        true,
        1,
        5
    ),
    -- Clase 2: Septiembre 2025
    (
        'Clase Historial - Septiembre',
        '7b6f49ae-d496-407b-bca1-f5f1e9370610',
        '6886490f-d830-483e-b454-5c526f445f9c',
        '6886490f-d830-483e-b454-5c526f445f9c',
        '2025-09-01',
        '2025-09-30',
        '19:00:00',
        60,
        ARRAY['Tuesday', 'Thursday'],
        50.00,
        'weekly',
        true,
        2,
        6
    ),
    -- Clase 3: Agosto 2025
    (
        'Clase Historial - Agosto',
        '7b6f49ae-d496-407b-bca1-f5f1e9370610',
        '6886490f-d830-483e-b454-5c526f445f9c',
        '6886490f-d830-483e-b454-5c526f445f9c',
        '2025-08-01',
        '2025-08-31',
        '17:00:00',
        60,
        ARRAY['Friday'],
        50.00,
        'weekly',
        true,
        1,
        4
    )
RETURNING id, name, start_date, end_date;

-- PASO 4: Insertar participación del usuario mark0 en estas clases
-- Ya tenemos los IDs de las clases creadas en el PASO 3
INSERT INTO class_participants (
    student_enrollment_id,
    class_id,
    status,
    payment_status,
    payment_verified
) VALUES
    ('b02a9f9c-566a-4d91-ae76-a77df654775d', 'c4ec9430-5b53-4428-9657-12d3f5b25d64', 'active', 'paid', true),
    ('b02a9f9c-566a-4d91-ae76-a77df654775d', '83f8dd71-85d3-4e47-b3ea-f6515d91ccb8', 'active', 'paid', true),
    ('b02a9f9c-566a-4d91-ae76-a77df654775d', '75a056e8-7a54-45fe-b830-27b41406ceb2', 'active', 'paid', true)
RETURNING id, student_enrollment_id, class_id;

-- PASO 5: Verificar que se crearon correctamente
WITH user_enrollments AS (
    SELECT id as enrollment_id
    FROM student_enrollments
    WHERE student_profile_id = 'd7a0172f-83b4-46b3-9647-d01821fc670a'
       OR email = 'mark0@gmail.com'
)
SELECT
    cp.id as participant_id,
    cp.student_enrollment_id,
    pc.id as class_id,
    pc.name as class_name,
    pc.start_date,
    pc.end_date,
    pc.start_time,
    cp.status,
    CASE
        WHEN pc.end_date < CURRENT_DATE THEN 'PASADA ✓'
        ELSE 'FUTURA'
    END as estado
FROM class_participants cp
INNER JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE cp.student_enrollment_id IN (SELECT enrollment_id FROM user_enrollments)
ORDER BY pc.end_date DESC;
