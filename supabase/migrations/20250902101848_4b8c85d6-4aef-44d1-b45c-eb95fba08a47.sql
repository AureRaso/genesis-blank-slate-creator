-- Eliminar manualmente todos los registros excepto uno por cada student_enrollment para la clase problema
DELETE FROM class_participants 
WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c' 
AND id NOT IN (
  SELECT DISTINCT ON (se.email) cp.id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE cp.class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  ORDER BY se.email, cp.created_at ASC
);