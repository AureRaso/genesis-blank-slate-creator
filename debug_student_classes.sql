-- SCRIPT DE VERIFICACIÓN: Debug de clases de estudiantes
-- Ejecuta estas consultas una por una en el SQL Editor de Supabase

-- 1. Verificar student_enrollments existentes
SELECT
    'STUDENT_ENROLLMENTS' as tabla,
    COUNT(*) as total_registros
FROM student_enrollments;

-- 2. Ver algunos ejemplos de student_enrollments
SELECT
    id,
    email,
    created_by_profile_id,
    created_at
FROM student_enrollments
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar class_participants existentes
SELECT
    'CLASS_PARTICIPANTS' as tabla,
    COUNT(*) as total_registros
FROM class_participants;

-- 4. Ver algunos ejemplos de class_participants con su relación
SELECT
    cp.id,
    cp.student_enrollment_id,
    se.email,
    pc.name as class_name,
    cp.status
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
LIMIT 5;

-- 5. Verificar relación completa: profiles -> student_enrollments -> class_participants
SELECT
    p.email as profile_email,
    se.email as enrollment_email,
    pc.name as class_name,
    cp.status as participation_status,
    cp.payment_status
FROM profiles p
JOIN student_enrollments se ON se.created_by_profile_id = p.id
JOIN class_participants cp ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON pc.id = cp.class_id
LIMIT 10;

-- 6. Ver si hay discrepancias entre emails de profiles y student_enrollments
SELECT
    p.email as profile_email,
    se.email as enrollment_email,
    CASE
        WHEN p.email = se.email THEN 'MATCH'
        ELSE 'MISMATCH'
    END as email_comparison
FROM profiles p
JOIN student_enrollments se ON se.created_by_profile_id = p.id
LIMIT 10;