-- ANÁLISIS ESPECÍFICO: Problema con clase "Test directo" asignada a auuu@gm.com
-- Ejecuta estas consultas una por una

-- 1. Verificar si existe la clase "Test directo"
SELECT
    id,
    name,
    created_by,
    trainer_profile_id,
    club_id,
    created_at
FROM programmed_classes
WHERE name ILIKE '%Test directo%'
ORDER BY created_at DESC;

-- 2. Verificar perfiles relacionados con auuu@gm.com
SELECT
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles
WHERE email = 'auuu@gm.com';

-- 3. Verificar student_enrollments para auuu@gm.com
SELECT
    se.id,
    se.email,
    se.created_by_profile_id,
    p.email as creator_profile_email,
    se.created_at
FROM student_enrollments se
LEFT JOIN profiles p ON p.id = se.created_by_profile_id
WHERE se.email = 'auuu@gm.com'
ORDER BY se.created_at DESC;

-- 4. Verificar si existe class_participant para "Test directo" y auuu@gm.com
SELECT
    cp.id,
    cp.class_id,
    cp.student_enrollment_id,
    cp.status,
    cp.payment_status,
    pc.name as class_name,
    se.email as enrollment_email,
    cp.created_at
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.name ILIKE '%Test directo%'
AND se.email = 'auuu@gm.com';

-- 5. Verificar todos los class_participants recientes para auuu@gm.com
SELECT
    cp.id,
    cp.class_id,
    pc.name as class_name,
    cp.status,
    cp.payment_status,
    se.email as enrollment_email,
    se.created_by_profile_id,
    cp.created_at
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'auuu@gm.com'
ORDER BY cp.created_at DESC
LIMIT 10;

-- 6. Verificar si hay profile con email auuu@gm.com y sus enrollments por profile_id
SELECT
    p.id as profile_id,
    p.email as profile_email,
    se.id as enrollment_id,
    se.email as enrollment_email,
    se.created_at as enrollment_created_at
FROM profiles p
LEFT JOIN student_enrollments se ON se.created_by_profile_id = p.id
WHERE p.email = 'auuu@gm.com'
ORDER BY se.created_at DESC;