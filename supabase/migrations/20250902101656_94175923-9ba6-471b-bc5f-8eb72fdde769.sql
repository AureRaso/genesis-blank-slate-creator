-- Primero, crear una tabla temporal con solo los registros únicos
WITH unique_participants AS (
  SELECT DISTINCT ON (class_id, student_enrollment_id) 
    id, class_id, student_enrollment_id, status, created_at, updated_at, discount_1, discount_2
  FROM class_participants
  ORDER BY class_id, student_enrollment_id, created_at ASC
)
-- Eliminar todos los registros duplicados
DELETE FROM class_participants 
WHERE id NOT IN (SELECT id FROM unique_participants);

-- Agregar una restricción única para prevenir futuros duplicados
ALTER TABLE class_participants 
ADD CONSTRAINT unique_student_per_class 
UNIQUE (class_id, student_enrollment_id);