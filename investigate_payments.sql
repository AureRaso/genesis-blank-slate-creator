-- =====================================================
-- INVESTIGAR DATOS DE PAGOS
-- =====================================================

-- 1. Ver TODOS los clubs que existen
SELECT id, name, created_at
FROM clubs
ORDER BY name;

-- =====================================================

-- 2. Ver TODOS los pagos mensuales (sin filtrar por club)
SELECT
  mp.id,
  mp.status,
  mp.month,
  mp.year,
  mp.total_amount,
  se.full_name as student_name,
  c.name as club_name
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
ORDER BY mp.year DESC, mp.month DESC, c.name, se.full_name;

-- =====================================================

-- 3. Ver cuántos pagos hay por club
SELECT
  c.name as club_name,
  COUNT(mp.id) as total_payments,
  COUNT(CASE WHEN mp.status = 'pendiente' THEN 1 END) as pendiente,
  COUNT(CASE WHEN mp.status = 'en_revision' THEN 1 END) as en_revision,
  COUNT(CASE WHEN mp.status = 'pagado' THEN 1 END) as pagado
FROM clubs c
LEFT JOIN student_enrollments se ON se.club_id = c.id
LEFT JOIN monthly_payments mp ON mp.student_enrollment_id = se.id
GROUP BY c.id, c.name
ORDER BY total_payments DESC, c.name;

-- =====================================================

-- 4. Ver todos los pagos agrupados por mes y año
SELECT
  mp.year,
  mp.month,
  COUNT(*) as total_payments,
  SUM(mp.total_amount) as total_amount,
  STRING_AGG(DISTINCT c.name, ', ') as clubs
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
GROUP BY mp.year, mp.month
ORDER BY mp.year DESC, mp.month DESC;

-- =====================================================

-- 5. Buscar club Hespérides con diferentes variaciones del nombre
SELECT id, name, created_at
FROM clubs
WHERE name ILIKE '%hesp%'
   OR name ILIKE '%hésp%'
   OR name ILIKE '%hesperid%'
   OR name ILIKE '%hespérid%';

-- =====================================================

-- 6. Ver pagos del mes actual (cualquier club)
SELECT
  mp.id,
  mp.status,
  mp.month,
  mp.year,
  mp.total_amount,
  se.full_name as student_name,
  c.name as club_name
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN clubs c ON c.id = se.club_id
WHERE mp.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND mp.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY c.name, se.full_name;

-- =====================================================
-- FIN DE INVESTIGACIÓN
-- =====================================================
