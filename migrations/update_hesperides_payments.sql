-- =====================================================
-- PRUEBA CONTROLADA: Actualizar pagos - Hespérides Padel
-- =====================================================

-- PASO 1: Ver todos los pagos existentes de Hespérides Padel
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
WHERE c.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Hespérides Padel ID
ORDER BY mp.year DESC, mp.month DESC, se.full_name;

-- =====================================================
-- PASO 2: Contar cuántos pagos hay por mes/año
-- =====================================================
SELECT
  mp.year,
  mp.month,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN mp.status = 'pendiente' THEN 1 END) as pendiente,
  COUNT(CASE WHEN mp.status = 'en_revision' THEN 1 END) as en_revision,
  COUNT(CASE WHEN mp.status = 'pagado' THEN 1 END) as pagado,
  SUM(mp.total_amount) as total_amount
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
GROUP BY mp.year, mp.month
ORDER BY mp.year DESC, mp.month DESC;

-- =====================================================
-- PASO 3: Crear respaldo de TODOS los pagos de Hespérides Padel
-- =====================================================
DROP TABLE IF EXISTS monthly_payments_backup_hesperides;

CREATE TABLE monthly_payments_backup_hesperides AS
SELECT mp.*
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Verificar que el respaldo se creó correctamente
SELECT
  COUNT(*) as "Total registros respaldados",
  COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendiente,
  COUNT(CASE WHEN status = 'en_revision' THEN 1 END) as en_revision,
  COUNT(CASE WHEN status = 'pagado' THEN 1 END) as pagado
FROM monthly_payments_backup_hesperides;

-- =====================================================
-- PASO 4: ACTUALIZAR - Marcar TODOS los pagos como 'pagado'
-- (O puedes cambiar el WHERE para filtrar por mes específico)
-- =====================================================

-- Opción A: Actualizar TODOS los pagos de Hespérides Padel
UPDATE monthly_payments mp
SET
  status = 'pagado',
  verified_paid_at = NOW(),
  verified_by = (SELECT id FROM auth.users WHERE email = 'player@gmail.com' LIMIT 1),
  rejected_at = NULL,
  rejected_by = NULL,
  rejection_reason = NULL,
  notes = COALESCE(notes, '') || ' [Aprobado automáticamente - Prueba]',
  updated_at = NOW()
FROM student_enrollments se
WHERE mp.student_enrollment_id = se.id
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  -- Descomenta la siguiente línea si solo quieres actualizar un mes específico:
  -- AND mp.month = 11 AND mp.year = 2025
RETURNING
  mp.id,
  se.full_name,
  mp.month,
  mp.year,
  mp.total_amount,
  mp.status;

-- =====================================================
-- PASO 5: Verificar los cambios
-- =====================================================
SELECT
  mp.id,
  mp.status,
  mp.month,
  mp.year,
  mp.total_amount,
  mp.verified_paid_at,
  mp.notes,
  se.full_name as student_name
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY mp.year DESC, mp.month DESC, se.full_name;

-- =====================================================
-- PASO 6 (OPCIONAL): REVERTIR cambios si es necesario
-- =====================================================

/*
-- DESCOMENTA ESTO SOLO SI NECESITAS REVERTIR

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
FROM monthly_payments_backup_hesperides backup
WHERE mp.id = backup.id;

-- Verificar que se restauró
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendiente,
  COUNT(CASE WHEN status = 'en_revision' THEN 1 END) as en_revision,
  COUNT(CASE WHEN status = 'pagado' THEN 1 END) as pagado
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
*/

-- =====================================================
-- PASO 7 (OPCIONAL): Limpiar respaldo cuando todo esté bien
-- =====================================================

/*
DROP TABLE IF EXISTS monthly_payments_backup_hesperides;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
