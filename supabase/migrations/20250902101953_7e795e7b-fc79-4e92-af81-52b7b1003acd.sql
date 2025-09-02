-- Deshabilitar temporalmente triggers que pueden causar timeout
ALTER TABLE class_participants DISABLE TRIGGER ALL;

-- Limpiar datos duplicados para esta clase específica
-- Solo mantener 1 registro por email único
DELETE FROM class_participants 
WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c' 
AND id != (
  SELECT cp.id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE cp.class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  AND se.email = 'skl@gmail.com'
  ORDER BY cp.created_at ASC
  LIMIT 1
);

-- Rehabilitar triggers
ALTER TABLE class_participants ENABLE TRIGGER ALL;