-- =====================================================
-- INVESTIGACIÓN CLASE DESAPARECIDA
-- Club: La Red 21 Galisport (bbc10821-1c94-4b62-97ac-2fde0708cefd)
-- Clase ID: db1ddcc3-ab6b-49fa-9f07-41e11f5e8019
-- =====================================================

-- 1. BUSCAR LA CLASE ESPECÍFICA POR ID
SELECT *
FROM programmed_classes
WHERE id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 2. SI NO EXISTE, LISTAR TODAS LAS CLASES DEL CLUB
SELECT
    id,
    name,
    days_of_week,
    start_time,
    end_time,
    max_students,
    is_active,
    created_at,
    updated_at
FROM programmed_classes
WHERE club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd'
ORDER BY start_time;

-- 3. VERIFICAR PARTICIPANTES QUE TENÍA LA CLASE
SELECT
    cp.id,
    cp.student_id,
    cp.status,
    cp.created_at,
    s.name as estudiante_nombre
FROM class_participants cp
LEFT JOIN students s ON cp.student_id = s.id
WHERE cp.programmed_class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 4. ÚLTIMAS CLASES MODIFICADAS EN EL CLUB
SELECT
    id,
    name,
    is_active,
    created_at,
    updated_at
FROM programmed_classes
WHERE club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd'
ORDER BY updated_at DESC
LIMIT 10;
