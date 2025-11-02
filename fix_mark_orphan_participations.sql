-- FIX: Limpiar participaciones huérfanas de Mark
-- Problema: Mark tiene participaciones en clases que ya no existen en programmed_classes

-- PASO 1: Ver participaciones huérfanas (participaciones sin clase programada)
SELECT
  cp.id as participation_id,
  cp.class_id,
  cp.status,
  cp.created_at,
  'HUÉRFANA - Clase no existe' as issue
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'mark@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM programmed_classes pc
    WHERE pc.id = cp.class_id
  )
ORDER BY cp.created_at DESC;

-- PASO 2: Eliminar participaciones huérfanas de Mark
-- IMPORTANTE: Descomenta esta línea solo después de verificar que las participaciones son realmente huérfanas
/*
DELETE FROM class_participants
WHERE id IN (
  SELECT cp.id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE se.email = 'mark@gmail.com'
    AND NOT EXISTS (
      SELECT 1
      FROM programmed_classes pc
      WHERE pc.id = cp.class_id
    )
);
*/

-- PASO 3: Verificar que Mark solo tiene participaciones válidas
SELECT
  cp.id as participation_id,
  pc.name as class_name,
  pc.start_date,
  pc.end_date,
  pc.days_of_week,
  cp.status,
  cp.created_at
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.email = 'mark@gmail.com'
ORDER BY cp.created_at DESC;
