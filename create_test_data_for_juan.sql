-- Script para crear datos de prueba para Juan Pérez García
-- Este script creará:
-- 1. Una clase programada para los lunes
-- 2. Un enrollment para Juan
-- 3. Un class_participant que vincule a Juan con la clase

-- PASO 1: Verificar que Juan existe
SELECT
    id,
    email,
    full_name,
    club_id
FROM profiles
WHERE email = 'juan@email.com';

-- PASO 2: Verificar si hay algún entrenador en el club de Juan
SELECT
    p.id,
    p.full_name,
    p.role,
    tc.club_id
FROM profiles p
JOIN trainer_clubs tc ON tc.trainer_profile_id = p.id
WHERE tc.club_id = (SELECT club_id FROM profiles WHERE email = 'juan@email.com')
LIMIT 1;

-- PASO 3: Crear una clase programada de prueba para los lunes
-- IMPORTANTE: Ejecuta esto solo si no existe ya una clase para los lunes
INSERT INTO programmed_classes (
    name,
    club_id,
    trainer_profile_id,
    start_time,
    duration_minutes,
    days_of_week,
    start_date,
    end_date,
    max_participants,
    price
)
SELECT
    'Clase de Padel - Lunes',
    (SELECT club_id FROM profiles WHERE email = 'juan@email.com'),
    (SELECT p.id FROM profiles p
     JOIN trainer_clubs tc ON tc.trainer_profile_id = p.id
     WHERE tc.club_id = (SELECT club_id FROM profiles WHERE email = 'juan@email.com')
     LIMIT 1),
    '18:00:00',
    90,
    ARRAY['lunes']::text[],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    8,
    50.00
WHERE NOT EXISTS (
    SELECT 1 FROM programmed_classes
    WHERE name = 'Clase de Padel - Lunes'
    AND club_id = (SELECT club_id FROM profiles WHERE email = 'juan@email.com')
)
RETURNING id, name, days_of_week;

-- PASO 4: Crear un enrollment para Juan
-- IMPORTANTE: Ejecuta esto solo si Juan no tiene ya un enrollment
INSERT INTO student_enrollments (
    trainer_profile_id,
    club_id,
    created_by_profile_id,
    full_name,
    email,
    phone,
    level,
    weekly_days,
    preferred_times,
    enrollment_period,
    enrollment_date,
    status
)
SELECT
    (SELECT p.id FROM profiles p
     JOIN trainer_clubs tc ON tc.trainer_profile_id = p.id
     WHERE tc.club_id = (SELECT club_id FROM profiles WHERE email = 'juan@email.com')
     LIMIT 1),
    (SELECT club_id FROM profiles WHERE email = 'juan@email.com'),
    (SELECT id FROM profiles WHERE email = 'juan@email.com'),
    'Juan Pérez García',
    'juan@email.com',
    '600123456',
    3.0,
    ARRAY['lunes']::text[],
    ARRAY['tarde']::text[],
    'mensual',
    CURRENT_DATE,
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM student_enrollments
    WHERE email = 'juan@email.com'
)
RETURNING id, full_name, email;

-- PASO 5: Vincular el enrollment de Juan con la clase programada
-- IMPORTANTE: Esto crea el class_participant
INSERT INTO class_participants (
    class_id,
    student_enrollment_id,
    status
)
SELECT
    (SELECT id FROM programmed_classes
     WHERE name = 'Clase de Padel - Lunes'
     AND club_id = (SELECT club_id FROM profiles WHERE email = 'juan@email.com')
     LIMIT 1),
    (SELECT id FROM student_enrollments WHERE email = 'juan@email.com' LIMIT 1),
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM class_participants cp
    JOIN student_enrollments se ON se.id = cp.student_enrollment_id
    WHERE se.email = 'juan@email.com'
    AND cp.class_id = (
        SELECT id FROM programmed_classes
        WHERE name = 'Clase de Padel - Lunes'
        AND club_id = (SELECT club_id FROM profiles WHERE email = 'juan@email.com')
        LIMIT 1
    )
)
RETURNING id;

-- VERIFICACIÓN FINAL: Comprobar que todo se creó correctamente
SELECT
    cp.id as participant_id,
    se.full_name as student_name,
    se.email as student_email,
    pc.name as class_name,
    pc.days_of_week,
    pc.start_time,
    cp.status
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'juan@email.com';
