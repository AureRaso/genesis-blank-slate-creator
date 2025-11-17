-- =====================================================
-- LIMPIAR PAGOS: Mantener solo Noviembre 2025
-- =====================================================
-- Este script elimina todos los pagos excepto los de Noviembre 2025
-- para el club Hespérides Padel

-- PASO 1: Ver todos los pagos actuales por mes/año
SELECT
  mp.year,
  mp.month,
  COUNT(*) as total_payments,
  SUM(mp.total_amount) as total_amount,
  STRING_AGG(DISTINCT se.full_name, ', ' ORDER BY se.full_name) as students
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
GROUP BY mp.year, mp.month
ORDER BY mp.year DESC, mp.month DESC;

-- =====================================================
-- PASO 2: Crear respaldo de TODOS los pagos antes de eliminar
-- =====================================================
DROP TABLE IF EXISTS monthly_payments_backup_before_cleanup;

CREATE TABLE monthly_payments_backup_before_cleanup AS
SELECT mp.*
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Verificar que el respaldo se creó correctamente
SELECT
  COUNT(*) as "Total registros respaldados",
  COUNT(CASE WHEN month = 11 AND year = 2025 THEN 1 END) as "Noviembre 2025",
  COUNT(CASE WHEN month != 11 OR year != 2025 THEN 1 END) as "Otros meses"
FROM monthly_payments_backup_before_cleanup;

-- =====================================================
-- PASO 3: Ver qué pagos se eliminarán (todos excepto Noviembre 2025)
-- =====================================================
SELECT
  mp.id,
  se.full_name,
  mp.month,
  mp.year,
  mp.total_classes,
  mp.total_amount,
  mp.status
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND (mp.month != 11 OR mp.year != 2025)
ORDER BY mp.year DESC, mp.month DESC, se.full_name;

-- =====================================================
-- PASO 4: ELIMINAR - Borrar todos los pagos excepto Noviembre 2025
-- =====================================================

/*
-- DESCOMENTA ESTO CUANDO ESTÉS LISTO PARA ELIMINAR

DELETE FROM monthly_payments mp
USING student_enrollments se
WHERE mp.student_enrollment_id = se.id
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND (mp.month != 11 OR mp.year != 2025)
RETURNING
  mp.id,
  se.full_name,
  mp.month,
  mp.year,
  mp.total_amount;
*/

-- =====================================================
-- PASO 5: Verificar que solo quedaron pagos de Noviembre 2025
-- =====================================================

/*
-- EJECUTA ESTO DESPUÉS DEL PASO 4

SELECT
  mp.year,
  mp.month,
  COUNT(*) as total_payments,
  SUM(mp.total_amount) as total_amount
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
GROUP BY mp.year, mp.month
ORDER BY mp.year DESC, mp.month DESC;

-- También ver todos los pagos restantes
SELECT
  mp.id,
  se.full_name,
  mp.month,
  mp.year,
  mp.total_classes,
  mp.total_amount,
  mp.status
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY se.full_name;
*/

-- =====================================================
-- PASO 6 (OPCIONAL): REVERTIR - Restaurar todos los pagos desde el respaldo
-- =====================================================

/*
-- DESCOMENTA ESTO SOLO SI NECESITAS REVERTIR TODOS LOS CAMBIOS

-- Primero eliminar los pagos actuales
DELETE FROM monthly_payments mp
USING student_enrollments se
WHERE mp.student_enrollment_id = se.id
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Luego restaurar desde el respaldo
INSERT INTO monthly_payments
SELECT * FROM monthly_payments_backup_before_cleanup;

-- Verificar que se restauró correctamente
SELECT
  year,
  month,
  COUNT(*) as total_payments
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
GROUP BY year, month
ORDER BY year DESC, month DESC;
*/

-- =====================================================
-- PASO 7 (OPCIONAL): Limpiar tabla de respaldo cuando todo esté bien
-- =====================================================

/*
DROP TABLE IF EXISTS monthly_payments_backup_before_cleanup;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
