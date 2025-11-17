-- Script para generar pagos mensuales de todos los class_participants existentes
-- Este script se ejecuta una sola vez para poblar los pagos de inscripciones ya existentes

DO $$
DECLARE
  participant_record RECORD;
  class_record RECORD;
  current_month INTEGER;
  current_year INTEGER;
  end_month INTEGER;
  end_year INTEGER;
  payments_generated INTEGER := 0;
BEGIN
  -- Iterar sobre todos los class_participants activos
  FOR participant_record IN
    SELECT
      cp.id,
      cp.class_id,
      cp.student_enrollment_id,
      cp.created_at
    FROM class_participants cp
    WHERE cp.status = 'active'
  LOOP
    -- Obtener detalles de la clase
    SELECT * INTO class_record
    FROM programmed_classes
    WHERE id = participant_record.class_id;

    -- Si la clase tiene precio mensual, generar pagos
    IF class_record.monthly_price IS NOT NULL AND class_record.monthly_price > 0 THEN
      -- Extraer mes y año de inicio
      current_month := EXTRACT(MONTH FROM class_record.start_date);
      current_year := EXTRACT(YEAR FROM class_record.start_date);

      -- Extraer mes y año de fin
      end_month := EXTRACT(MONTH FROM class_record.end_date);
      end_year := EXTRACT(YEAR FROM class_record.end_date);

      -- Generar pagos para cada mes
      WHILE (current_year < end_year) OR (current_year = end_year AND current_month <= end_month) LOOP
        -- Insertar pago mensual (ignorar si ya existe)
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

        -- Si se insertó, incrementar contador
        IF FOUND THEN
          payments_generated := payments_generated + 1;
        END IF;

        -- Incrementar mes
        current_month := current_month + 1;
        IF current_month > 12 THEN
          current_month := 1;
          current_year := current_year + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Log del resultado
  RAISE NOTICE 'Pagos mensuales generados: %', payments_generated;
END $$;
