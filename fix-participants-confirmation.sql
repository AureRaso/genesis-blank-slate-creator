-- Ver el estado actual de los participantes de la clase Test
SELECT
    pc.name as clase,
    se.full_name,
    se.email,
    cp.status,
    cp.attendance_confirmed_for_date,
    cp.absence_confirmed,
    cp.absence_confirmed_at,
    CASE
        WHEN cp.attendance_confirmed_for_date IS NOT NULL
        THEN '❌ PROBLEMA: Ya tiene attendance_confirmed_for_date = ' || cp.attendance_confirmed_for_date::text
        WHEN cp.absence_confirmed IS NOT NULL
        THEN '❌ PROBLEMA: Ya tiene absence_confirmed = ' || cp.absence_confirmed::text
        WHEN cp.status != 'active'
        THEN '❌ PROBLEMA: Status no es active, es: ' || cp.status
        ELSE '✅ OK: Debería recibir email'
    END as diagnostico
FROM programmed_classes pc
JOIN class_participants cp ON cp.class_id = pc.id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12';

-- SOLUCIÓN: Limpiar las confirmaciones para que puedan recibir el email de prueba
UPDATE class_participants
SET
    attendance_confirmed_for_date = NULL,
    absence_confirmed = NULL,
    absence_confirmed_at = NULL
WHERE class_id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12';

-- Verificar que se limpiaron correctamente
SELECT
    pc.name as clase,
    se.full_name,
    se.email,
    cp.attendance_confirmed_for_date,
    cp.absence_confirmed,
    '✅ Listo para recibir email de recordatorio' as estado
FROM programmed_classes pc
JOIN class_participants cp ON cp.class_id = pc.id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12'
    AND cp.attendance_confirmed_for_date IS NULL
    AND cp.absence_confirmed IS NULL;
