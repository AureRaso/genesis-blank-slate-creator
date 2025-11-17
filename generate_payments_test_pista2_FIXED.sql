-- =====================================================
-- Script CORREGIDO para generar pagos de "test -pista 2"
-- Club: Gali
-- =====================================================

-- PASO 1: Ver resumen de las clases
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
GROUP BY pc.id, pc.name, pc.monthly_price, pc.start_date, pc.end_date, c.name
ORDER BY pc.start_date;

-- PASO 2: Ver todos los participantes
SELECT
  cp.id as participant_id,
  se.id as student_enrollment_id,
  se.full_name,
  se.email,
  pc.name as class_name,
  pc.start_date,
  cp.status
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
JOIN class_participants cp ON cp.class_id = pc.id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE pc.name ILIKE '%test%pista%2%'
  AND c.name ILIKE '%gali%'
  AND cp.status = 'active'
ORDER BY se.full_name, pc.start_date;

-- PASO 3: Generar pagos para TODAS las clases "test -pista 2"
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
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GENERANDO PAGOS PARA CLASES "Test - Pista 2"';
  RAISE NOTICE '========================================';

  -- Iterar sobre TODAS las clases que coincidan
  FOR class_record IN
    SELECT pc.*
    FROM programmed_classes pc
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.name ILIKE class_name_filter
      AND c.name ILIKE club_name_filter
    ORDER BY pc.start_date
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Procesando clase: % (ID: %)', class_record.name, class_record.id;
    RAISE NOTICE '    Precio mensual: %€', class_record.monthly_price;
    RAISE NOTICE '    Periodo: % - %', class_record.start_date, class_record.end_date;

    -- Verificar que tiene precio mensual
    IF class_record.monthly_price IS NULL OR class_record.monthly_price = 0 THEN
      RAISE NOTICE '    ⚠️  SALTADA: No tiene precio mensual';
      CONTINUE;
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
      RAISE NOTICE '    👤 Estudiante: % (%)', participant_record.full_name, participant_record.email;

      -- Calcular meses
      current_month := EXTRACT(MONTH FROM class_record.start_date);
      current_year := EXTRACT(YEAR FROM class_record.start_date);
      end_month := EXTRACT(MONTH FROM class_record.end_date);
      end_year := EXTRACT(YEAR FROM class_record.end_date);

      -- Generar pagos para cada mes
      WHILE (current_year < end_year) OR (current_year = end_year AND current_month <= end_month) LOOP
        BEGIN
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
          );

          payments_generated := payments_generated + 1;
          RAISE NOTICE '       ✅ Pago creado: Mes %, Año %, Monto: %€', current_month, current_year, class_record.monthly_price;

        EXCEPTION
          WHEN unique_violation THEN
            RAISE NOTICE '       ⚠️  Ya existe pago para: Mes %, Año %', current_month, current_year;
        END;

        -- Incrementar mes
        current_month := current_month + 1;
        IF current_month > 12 THEN
          current_month := 1;
          current_year := current_year + 1;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Total de pagos NUEVOS generados: %', payments_generated;
  RAISE NOTICE '========================================';
END $$;

-- PASO 4: Verificar los pagos creados
SELECT
  mp.id,
  se.full_name as estudiante,
  se.email,
  pc.name as clase,
  pc.start_date as fecha_clase,
  mp.month as mes_pago,
  mp.year as año_pago,
  mp.amount as monto,
  mp.status,
  mp.created_at
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = mp.class_id
JOIN clubs c ON c.id = pc.club_id
WHERE pc.name ILIKE '%test%pista%2%'
  AND c.name ILIKE '%gali%'
ORDER BY se.full_name, pc.start_date, mp.year, mp.month;

-- PASO 5: Resumen por estudiante
SELECT
  se.full_name as estudiante,
  se.email,
  COUNT(DISTINCT mp.class_id) as clases_inscritas,
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

-- PASO 6: Verificar específicamente gal@vmi.com
SELECT
  'PAGOS DE gal@vmi.com' as info,
  se.full_name,
  se.email,
  pc.name as clase,
  TO_CHAR(pc.start_date, 'DD/MM/YYYY') as fecha_clase,
  mp.month || '/' || mp.year as periodo_pago,
  mp.amount || '€' as monto,
  mp.status
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
JOIN programmed_classes pc ON pc.id = mp.class_id
WHERE se.email = 'gal@vmi.com'
  AND pc.name ILIKE '%test%pista%2%'
ORDER BY pc.start_date, mp.year, mp.month;
