-- Primero, veo cuántos student_enrollments hay para el mismo email
-- Voy a eliminar duplicados por email también
WITH duplicated_enrollments AS (
  SELECT email, MIN(id) as keep_id
  FROM student_enrollments 
  WHERE email = 'skl@gmail.com'
  GROUP BY email
),
participants_to_keep AS (
  SELECT MIN(cp.id) as keep_participant_id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE cp.class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  AND se.email = 'skl@gmail.com'
)
-- Eliminar todos los participantes duplicados excepto uno
DELETE FROM class_participants 
WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
AND student_enrollment_id IN (
  SELECT id FROM student_enrollments WHERE email = 'skl@gmail.com'
)
AND id NOT IN (
  SELECT keep_participant_id FROM participants_to_keep
);