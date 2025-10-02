-- Script para limpiar participaciones duplicadas
-- EJECUTAR SOLO SI TIENES DUPLICADOS

-- 1. Ver duplicados actuales
SELECT
  cp.class_id,
  se.email,
  COUNT(*) as participation_count,
  STRING_AGG(cp.id::text, ', ') as participation_ids,
  STRING_AGG(cp.payment_status, ', ') as payment_statuses
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
GROUP BY cp.class_id, se.email
HAVING COUNT(*) > 1
ORDER BY participation_count DESC;

-- 2. Para cada duplicado, mantener solo el que tiene payment_status = 'paid'
-- Si ninguno tiene 'paid', mantener el más reciente

-- CUIDADO: Este script elimina datos. Asegúrate de hacer un backup antes.

-- Eliminar duplicados manteniendo solo el pagado o el más reciente
WITH ranked_participations AS (
  SELECT
    cp.id,
    cp.class_id,
    se.email,
    cp.payment_status,
    cp.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY cp.class_id, se.email
      ORDER BY
        CASE WHEN cp.payment_status = 'paid' THEN 1 ELSE 2 END,
        cp.created_at DESC
    ) as rn
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
),
duplicates AS (
  SELECT class_id, email
  FROM ranked_participations
  GROUP BY class_id, email
  HAVING COUNT(*) > 1
)
DELETE FROM class_participants
WHERE id IN (
  SELECT rp.id
  FROM ranked_participations rp
  JOIN duplicates d ON rp.class_id = d.class_id AND rp.email = d.email
  WHERE rp.rn > 1
);

-- 3. Verificar que no quedan duplicados
SELECT
  cp.class_id,
  se.email,
  COUNT(*) as participation_count
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
GROUP BY cp.class_id, se.email
HAVING COUNT(*) > 1;