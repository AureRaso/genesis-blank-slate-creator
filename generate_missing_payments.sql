-- =====================================================
-- GENERAR PAGOS MENSUALES FALTANTES - Hespérides Padel
-- =====================================================

-- PASO 1: Ver estudiantes inscritos en Hespérides Padel
SELECT
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.phone,
  se.created_at
FROM student_enrollments se
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND se.status = 'active'
ORDER BY se.full_name;

-- =====================================================
-- PASO 2: Ver participaciones en clases de estos estudiantes
-- =====================================================
SELECT
  se.full_name as student_name,
  pc.name as class_name,
  pc.start_date,
  pc.start_time,
  EXTRACT(MONTH FROM pc.start_date) as month,
  EXTRACT(YEAR FROM pc.start_date) as year,
  cp.status as participation_status,
  cp.created_at as enrolled_at
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND cp.status = 'active'
  AND pc.is_active = true
ORDER BY se.full_name, pc.start_date;

-- =====================================================
-- PASO 3: Contar clases por estudiante por mes
-- =====================================================
SELECT
  se.id as enrollment_id,
  se.full_name,
  EXTRACT(MONTH FROM pc.start_date)::INTEGER as month,
  EXTRACT(YEAR FROM pc.start_date)::INTEGER as year,
  COUNT(*) as total_classes,
  STRING_AGG(pc.name, ', ') as class_names
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND cp.status = 'active'
  AND pc.is_active = true
GROUP BY se.id, se.full_name, month, year
ORDER BY year DESC, month DESC, se.full_name;

-- =====================================================
-- PASO 4: Generar pagos mensuales para todos los estudiantes
-- (Esto ejecutará la función que crea los pagos)
-- =====================================================

-- Primero, ver qué pagos se crearían (SIN ejecutar, solo ver)
SELECT
  se.id as enrollment_id,
  se.full_name,
  EXTRACT(MONTH FROM pc.start_date)::INTEGER as month,
  EXTRACT(YEAR FROM pc.start_date)::INTEGER as year,
  COUNT(*) as total_classes,
  COUNT(*) * 10.00 as total_amount,
  'Se creará pago' as action
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND cp.status = 'active'
  AND pc.is_active = true
GROUP BY se.id, se.full_name, month, year
ORDER BY year DESC, month DESC, se.full_name;

-- =====================================================
-- PASO 5: EJECUTAR - Crear los pagos mensuales
-- =====================================================

/*
-- DESCOMENTA ESTO CUANDO ESTÉS LISTO PARA CREAR LOS PAGOS

DO $$
DECLARE
  student_record RECORD;
  payment_id UUID;
BEGIN
  -- Para cada estudiante con clases en cada mes
  FOR student_record IN
    SELECT DISTINCT
      se.id as enrollment_id,
      EXTRACT(MONTH FROM pc.start_date)::INTEGER as month,
      EXTRACT(YEAR FROM pc.start_date)::INTEGER as year
    FROM class_participants cp
    JOIN student_enrollments se ON se.id = cp.student_enrollment_id
    JOIN programmed_classes pc ON pc.id = cp.class_id
    WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
      AND cp.status = 'active'
      AND pc.is_active = true
  LOOP
    -- Llamar a la función que crea/actualiza el pago mensual
    payment_id := calculate_and_create_monthly_payment(
      student_record.enrollment_id,
      student_record.month,
      student_record.year,
      10.00  -- Precio por clase
    );

    RAISE NOTICE 'Pago creado/actualizado: % para mes % año %',
      payment_id, student_record.month, student_record.year;
  END LOOP;
END $$;

-- Verificar los pagos creados
SELECT
  mp.id,
  mp.status,
  mp.month,
  mp.year,
  mp.total_classes,
  mp.total_amount,
  se.full_name as student_name
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY mp.year DESC, mp.month DESC, se.full_name;
*/

-- =====================================================
-- PASO 6: Marcar todos los pagos como 'pagado' (DESPUÉS del PASO 5)
-- =====================================================

/*
-- DESCOMENTA ESTO SOLO DESPUÉS DE CREAR LOS PAGOS

UPDATE monthly_payments mp
SET
  status = 'pagado',
  verified_paid_at = NOW(),
  verified_by = (SELECT id FROM auth.users WHERE email = 'player@gmail.com' LIMIT 1),
  notes = 'Aprobado automáticamente',
  updated_at = NOW()
FROM student_enrollments se
WHERE mp.student_enrollment_id = se.id
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
RETURNING
  mp.id,
  se.full_name,
  mp.month,
  mp.year,
  mp.total_amount,
  mp.status;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
