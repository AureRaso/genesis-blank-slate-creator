-- =====================================================
-- PRUEBA CONTROLADA: Actualizar pagos de Noviembre - Club Hespérides
-- =====================================================
-- Este script permite probar la actualización de pagos de forma segura

-- PASO 1: Ver el estado actual de los pagos de Noviembre 2025 en Hespérides
-- (Ejecuta esto primero para ver qué datos tenemos)
SELECT
  mp.id,
  mp.status,
  mp.month,
  mp.year,
  mp.total_amount,
  mp.verified_paid_at,
  mp.rejected_at,
  se.full_name as student_name,
  c.name as club_name
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
WHERE c.name ILIKE '%hespérides%'
  AND mp.month = 11
  AND mp.year = 2025
ORDER BY se.full_name;

-- =====================================================
-- PASO 2: Crear tabla de respaldo ANTES de hacer cambios
-- (Ejecuta esto para guardar una copia de los datos originales)
-- =====================================================

-- Crear tabla temporal de respaldo si no existe
CREATE TABLE IF NOT EXISTS monthly_payments_backup_nov2025 AS
SELECT mp.*
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
WHERE c.name ILIKE '%hespérides%'
  AND mp.month = 11
  AND mp.year = 2025;

-- Verificar que el respaldo se creó correctamente
SELECT COUNT(*) as "Registros respaldados"
FROM monthly_payments_backup_nov2025;

-- =====================================================
-- PASO 3: Actualizar pagos a 'pagado' (SOLO SI PASO 1 Y 2 FUERON EXITOSOS)
-- =====================================================

-- Actualizar los pagos de Noviembre 2025 en Hespérides
UPDATE monthly_payments mp
SET
  status = 'pagado',
  verified_paid_at = NOW(),
  verified_by = (SELECT id FROM auth.users WHERE email = 'player@gmail.com' LIMIT 1),
  rejected_at = NULL,
  rejected_by = NULL,
  rejection_reason = NULL,
  notes = COALESCE(notes, '') || ' [Prueba controlada - Actualizado automáticamente]',
  updated_at = NOW()
FROM student_enrollments se
JOIN clubs c ON c.id = se.club_id
WHERE mp.student_enrollment_id = se.id
  AND c.name ILIKE '%hespérides%'
  AND mp.month = 11
  AND mp.year = 2025
RETURNING mp.id, se.full_name, mp.total_amount, mp.status;

-- =====================================================
-- PASO 4: Verificar los cambios
-- =====================================================

-- Ver el estado DESPUÉS de la actualización
SELECT
  mp.id,
  mp.status,
  mp.month,
  mp.year,
  mp.total_amount,
  mp.verified_paid_at,
  mp.notes,
  se.full_name as student_name,
  c.name as club_name
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
WHERE c.name ILIKE '%hespérides%'
  AND mp.month = 11
  AND mp.year = 2025
ORDER BY se.full_name;

-- =====================================================
-- PASO 5 (OPCIONAL): REVERTIR CAMBIOS si algo salió mal
-- =====================================================

/*
-- DESCOMENTA Y EJECUTA ESTO SOLO SI NECESITAS REVERTIR LOS CAMBIOS

-- Restaurar los datos desde el respaldo
UPDATE monthly_payments mp
SET
  status = backup.status,
  verified_paid_at = backup.verified_paid_at,
  verified_by = backup.verified_by,
  rejected_at = backup.rejected_at,
  rejected_by = backup.rejected_by,
  rejection_reason = backup.rejection_reason,
  notes = backup.notes,
  updated_at = backup.updated_at,
  marked_paid_at = backup.marked_paid_at,
  payment_method = backup.payment_method
FROM monthly_payments_backup_nov2025 backup
WHERE mp.id = backup.id;

-- Verificar que se restauró correctamente
SELECT
  mp.id,
  mp.status,
  se.full_name,
  mp.total_amount
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
WHERE c.name ILIKE '%hespérides%'
  AND mp.month = 11
  AND mp.year = 2025
ORDER BY se.full_name;
*/

-- =====================================================
-- PASO 6 (OPCIONAL): Limpiar tabla de respaldo
-- =====================================================

/*
-- DESCOMENTA Y EJECUTA ESTO cuando estés seguro de que todo está bien
-- y ya no necesitas el respaldo

DROP TABLE IF EXISTS monthly_payments_backup_nov2025;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
