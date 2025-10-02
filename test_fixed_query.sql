-- PRUEBA: Verificar que la consulta corregida funcione
-- Esta simula lo que ahora hace el hook corregido

-- Usar un profile_id real de los datos que vimos
-- Por ejemplo: "705cfcd4-84ef-4d88-9a63-366747621858" que aparece en varios enrollments

WITH user_enrollments AS (
    SELECT id
    FROM student_enrollments
    WHERE created_by_profile_id = '705cfcd4-84ef-4d88-9a63-366747621858'  -- Pon aquí un profile_id real
)
SELECT
    cp.id,
    cp.status,
    cp.payment_status,
    pc.name as class_name,
    se.email as enrollment_email
FROM class_participants cp
JOIN user_enrollments ue ON cp.student_enrollment_id = ue.id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
ORDER BY cp.created_at DESC;