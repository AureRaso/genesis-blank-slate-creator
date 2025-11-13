-- Verificar participantes de la clase Test

-- 1. Ver si la clase tiene participantes
SELECT
    'Participantes de la clase Test' as info,
    COUNT(*) as total_participantes
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12';

-- 2. Ver detalle de todos los participantes (incluso inactivos)
SELECT
    pc.name as clase,
    se.full_name,
    se.email,
    cp.status as participant_status,
    cp.attendance_confirmed_for_date,
    cp.absence_confirmed,
    CASE
        WHEN cp.status = 'active' AND cp.attendance_confirmed_for_date IS NULL AND cp.absence_confirmed IS NULL
        THEN '✅ DEBERÍA RECIBIR EMAIL'
        WHEN cp.status != 'active'
        THEN '❌ PARTICIPANTE NO ACTIVO'
        WHEN cp.attendance_confirmed_for_date IS NOT NULL
        THEN '⏭️ YA CONFIRMÓ ASISTENCIA'
        WHEN cp.absence_confirmed = true
        THEN '⏭️ YA CONFIRMÓ AUSENCIA'
    END as estado
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12';

-- 3. Si no hay participantes, mostrar mensaje
SELECT
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM class_participants cp
            WHERE cp.class_id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12'
        )
        THEN '⚠️ La clase NO tiene participantes. Necesitas añadir jugadores a la clase.'
        ELSE '✅ La clase tiene participantes'
    END as resultado;
