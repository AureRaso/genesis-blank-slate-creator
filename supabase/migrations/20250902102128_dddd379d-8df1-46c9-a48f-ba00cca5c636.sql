-- Eliminar temporalmente el trigger problemático
DROP TRIGGER IF EXISTS trigger_detect_available_spots_trigger ON class_participants;

-- Ahora limpiar todos los datos duplicados de una vez
WITH keep_record AS (
  SELECT cp.id as keep_id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE cp.class_id = '51810799-7c86-47d3-9b57-7f25323a408c'
  AND se.email = 'skl@gmail.com'
  ORDER BY cp.created_at ASC
  LIMIT 1
)
DELETE FROM class_participants 
WHERE class_id = '51810799-7c86-47d3-9b57-7f25323a408c' 
AND id NOT IN (SELECT keep_id FROM keep_record);

-- Recrear el trigger (si era necesario)
-- CREATE TRIGGER trigger_detect_available_spots_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON class_participants
-- FOR EACH ROW EXECUTE FUNCTION trigger_detect_available_spots();