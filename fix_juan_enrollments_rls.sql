-- Verificar y arreglar el problema de RLS con los enrollments de Juan

-- PASO 1: Ver los enrollments de Juan y verificar created_by_profile_id
SELECT
    id,
    full_name,
    email,
    created_by_profile_id,
    status
FROM student_enrollments
WHERE email = 'juan@email.com';

-- PASO 2: Ver el ID de Juan en profiles
SELECT id, email, full_name
FROM profiles
WHERE email = 'juan@email.com';

-- PASO 3: Actualizar created_by_profile_id para que Juan pueda ver sus enrollments
-- Esto hace que created_by_profile_id apunte al profile de Juan
UPDATE student_enrollments
SET created_by_profile_id = (
    SELECT id FROM profiles WHERE email = 'juan@email.com'
)
WHERE email = 'juan@email.com'
AND created_by_profile_id != (SELECT id FROM profiles WHERE email = 'juan@email.com');

-- PASO 4: Verificar que se actualizó correctamente
SELECT
    id,
    full_name,
    email,
    created_by_profile_id,
    (created_by_profile_id = (SELECT id FROM profiles WHERE email = 'juan@email.com')) as is_owned_by_juan
FROM student_enrollments
WHERE email = 'juan@email.com';

-- ALTERNATIVA: Crear una política RLS adicional para que los players puedan ver enrollments que coincidan con su email
-- Ejecuta esto si prefieres no modificar los datos existentes:

/*
CREATE POLICY "Players can view enrollments matching their email"
ON student_enrollments
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.email = student_enrollments.email
        AND profiles.role = 'player'
    )
);
*/
