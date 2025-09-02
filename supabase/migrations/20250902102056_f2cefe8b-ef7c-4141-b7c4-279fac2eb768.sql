-- Eliminar en lotes pequeños para evitar timeout
-- Primero obtener el ID que queremos mantener
WITH keep_record AS (
  SELECT cp.id as keep_id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE cp.class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  AND se.email = 'skl@gmail.com'
  ORDER BY cp.created_at ASC
  LIMIT 1
)
-- Eliminar solo los primeros 1000 registros duplicados
DELETE FROM class_participants 
WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c' 
AND id NOT IN (SELECT keep_id FROM keep_record)
AND id IN (
  SELECT cp2.id 
  FROM class_participants cp2
  JOIN student_enrollments se2 ON se2.id = cp2.student_enrollment_id
  WHERE cp2.class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  AND se2.email = 'skl@gmail.com'
  ORDER BY cp2.created_at DESC
  LIMIT 1000
);