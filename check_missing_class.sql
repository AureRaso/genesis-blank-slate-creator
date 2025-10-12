-- Verificar por qué la clase '5832fef2-d4ba-4cef-92fc-2db795bfed28' no se devuelve

-- PASO 1: Verificar que la clase existe (sin RLS)
SELECT
    id,
    name,
    days_of_week,
    start_time,
    club_id,
    trainer_profile_id
FROM programmed_classes
WHERE id = '5832fef2-d4ba-4cef-92fc-2db795bfed28';

-- PASO 2: Ver las políticas RLS de programmed_classes
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'programmed_classes'
ORDER BY policyname;

-- PASO 3: Verificar si Juan puede ver esta clase (simular el query del frontend)
-- Esto lo ejecutas como Juan (ya estás logueado como él en el frontend)
SELECT
    id,
    name,
    days_of_week,
    start_time,
    duration_minutes,
    start_date,
    end_date,
    trainer_profile_id,
    club_id
FROM programmed_classes
WHERE id IN (
    '5832fef2-d4ba-4cef-92fc-2db795bfed28',
    '644fb463-6a20-43cf-9205-82dcdb03da4c',
    'a1582475-867f-420e-a84b-71ad4448d60f'
);

-- PASO 4: Crear una política RLS para que los players puedan ver las clases en las que participan
CREATE POLICY IF NOT EXISTS "Players can view classes they participate in"
ON programmed_classes
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM class_participants cp
        JOIN student_enrollments se ON se.id = cp.student_enrollment_id
        JOIN profiles p ON p.id = se.created_by_profile_id
        WHERE cp.class_id = programmed_classes.id
        AND p.id = auth.uid()
        AND cp.status = 'active'
    )
);
