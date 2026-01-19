-- 1. VER PARTICIPANTES DE LA CLASE con datos de contacto
SELECT
    cp.id,
    cp.student_enrollment_id,
    cp.status,
    cp.created_at,
    se.full_name as alumno_nombre,
    se.phone as alumno_telefono,
    se.email as alumno_email
FROM class_participants cp
LEFT JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 2. Si la anterior no funciona, probar con programmed_class_id
SELECT
    cp.id,
    cp.student_enrollment_id,
    cp.status,
    cp.created_at,
    se.full_name as alumno_nombre,
    se.phone as alumno_telefono,
    se.email as alumno_email
FROM class_participants cp
LEFT JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019'
   OR cp.id IN (
       SELECT id FROM class_participants
       WHERE class_id::text LIKE '%db1ddcc3%'
   );

-- 3. Ver todos los participantes de la clase directamente
SELECT * FROM class_participants
WHERE class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';
