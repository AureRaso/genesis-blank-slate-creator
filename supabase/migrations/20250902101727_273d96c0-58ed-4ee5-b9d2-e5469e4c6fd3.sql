-- Eliminar manualmente los registros duplicados manteniendo solo el primero
DELETE FROM class_participants 
WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c' 
AND student_enrollment_id IN (
  SELECT student_enrollment_id 
  FROM class_participants 
  WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  GROUP BY student_enrollment_id 
  HAVING COUNT(*) > 1
)
AND id NOT IN (
  SELECT DISTINCT ON (student_enrollment_id) id
  FROM class_participants 
  WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  ORDER BY student_enrollment_id, created_at ASC
);