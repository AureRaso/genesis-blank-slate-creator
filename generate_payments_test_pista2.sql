-- =====================================================
-- Script para generar pagos de la clase "test -pista 2"
-- Club: Gali
-- =====================================================

-- PASO 1: Primero ejecuta el script de migración principal si aún no lo has hecho
-- (FIXED_monthly_payments_migration_NO_EXISTING.sql)

-- PASO 2: Identificar la clase y sus participantes
-- Verificar que encontramos la clase correcta
SELECT
  pc.id as class_id,
  pc.name as class_name,
  pc.monthly_price,
  pc.start_date,
  pc.end_date,
  c.name as club_name,
  COUNT(cp.id) as total_participants
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
LEFT JOIN class_participants cp ON cp.class_id = pc.id AND cp.status = 'active'
WHERE pc.name ILIKE '%test%pista%2%'
  AND c.name ILIKE '%gali%'
GROUP BY pc.id, pc.name, pc.monthly_price, pc.start_date, pc.end_date, c.name;

-- PASO 3: Ver los participantes de esta clase
SELECT
  cp.id as participant_id,
  se.id as student_enrollment_id,
  se.full_name,
  se.email,
  cp.status
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
JOIN class_participants cp ON cp.class_id = pc.id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.name ILIKE '%test%pista%2%'
  AND c.name ILIKE '%gali%'
  AND cp.status = 'active';

-- PASO 4: Generar pagos mensuales para esta clase específica
DO $$
DECLARE
  participant_record RECORD;
  class_record RECORD;
  current_month INTEGER;
  current_year INTEGER;
  end_month INTEGER;
  end_year INTEGER;
  payments_generated INTEGER := 0;
  class_name_filter TEXT := '%test%pista%2%';
  club_name_filter TEXT := '%gali%';
BEGIN
  -- Obtener la clase específica
  SELECT pc.* INTO class_record
  FROM programmed_classes pc
  JOIN clubs c ON c.id = pc.club_id
  WHERE pc.name ILIKE class_name_filter
    AND c.name ILIKE club_name_filter
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró la clase "test -pista 2" en el club "Gali"';
  END IF;

  RAISE NOTICE 'Clase encontrada: % (ID: %)', class_record.name, class_record.id;
  RAISE NOTICE 'Precio mensual: %€', class_record.monthly_price;
  RAISE NOTICE 'Periodo: % - %', class_record.start_date, class_record.end_date;

  -- Verificar que tiene precio mensual
  IF class_record.monthly_price IS NULL OR class_record.monthly_price = 0 THEN
    RAISE EXCEPTION 'La clase no tiene precio mensual configurado';
  END IF;

  -- Iterar sobre todos los participantes activos de esta clase
  FOR participant_record IN
    SELECT
      cp.id,
      cp.class_id,
      cp.student_enrollment_id,
      se.full_name,
      se.email
    FROM class_participants cp
    JOIN student_enrollments se ON se.id = cp.student_enrollment_id
    WHERE cp.class_id = class_record.id
      AND cp.status = 'active'
  LOOP
    RAISE NOTICE 'Generando pagos para: % (%)', participant_record.full_name, participant_record.email;

    -- Calcular meses
    current_month := EXTRACT(MONTH FROM class_record.start_date);
    current_year := EXTRACT(YEAR FROM class_record.start_date);
    end_month := EXTRACT(MONTH FROM class_record.end_date);
    end_year := EXTRACT(YEAR FROM class_record.end_date);

    -- Generar pagos para cada mes
    WHILE (current_year < end_year) OR (current_year = end_year AND current_month <= end_month) LOOP
      INSERT INTO monthly_payments (
        student_enrollment_id,
        class_id,
        month,
        year,
        amount,
        status
      ) VALUES (
        participant_record.student_enrollment_id,
        participant_record.class_id,
        current_month,
        current_year,
        class_record.monthly_price,
        'pendiente'
      )
      ON CONFLICT (student_enrollment_id, class_id, month, year) DO NOTHING;

      IF FOUND THEN
        payments_generated := payments_generated + 1;
        RAISE NOTICE '  - Pago creado: Mes %, Año %, Monto: %€', current_month, current_year, class_record.monthly_price;
      END IF;

      -- Incrementar mes
      current_month := current_month + 1;
      IF current_month > 12 THEN
        current_month := 1;
        current_year := current_year + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de pagos generados: %', payments_generated;
  RAISE NOTICE '========================================';
END $$;

-- PASO 5: Verificar los pagos creados
SELECT
  mp.id,
  se.full_name as estudiante,
  se.email,
  pc.name as clase,
  mp.month,
  mp.year,
  mp.amount,
  mp.status,
  mp.created_at
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = mp.class_id
JOIN clubs c ON c.id = pc.club_id
WHERE pc.name ILIKE '%test%pista%2%'
  AND c.name ILIKE '%gali%'
ORDER BY se.full_name, mp.year, mp.month;

-- PASO 6: Resumen por estudiante
SELECT
  se.full_name as estudiante,
  se.email,
  COUNT(*) as total_pagos,
  SUM(mp.amount) as total_a_pagar,
  SUM(CASE WHEN mp.status = 'pendiente' THEN mp.amount ELSE 0 END) as pendiente,
  SUM(CASE WHEN mp.status = 'en_revision' THEN mp.amount ELSE 0 END) as en_revision,
  SUM(CASE WHEN mp.status = 'pagado' THEN mp.amount ELSE 0 END) as pagado
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = mp.class_id
JOIN clubs c ON c.id = pc.club_id
WHERE pc.name ILIKE '%test%pista%2%'
  AND c.name ILIKE '%gali%'
GROUP BY se.full_name, se.email
ORDER BY se.full_name;
