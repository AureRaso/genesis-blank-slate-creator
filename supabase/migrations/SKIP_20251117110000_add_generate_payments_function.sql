-- Función para generar pagos mensuales de un class_participant específico o todos
-- Esta función puede ser llamada manualmente para generar pagos de participantes existentes

CREATE OR REPLACE FUNCTION generate_monthly_payments_for_participant(participant_id UUID DEFAULT NULL)
RETURNS TABLE (
  payments_generated INTEGER,
  message TEXT
) AS $$
DECLARE
  participant_record RECORD;
  class_record RECORD;
  current_month INTEGER;
  current_year INTEGER;
  end_month INTEGER;
  end_year INTEGER;
  total_payments INTEGER := 0;
  participant_count INTEGER := 0;
BEGIN
  -- Si se proporciona un participant_id específico, solo procesar ese
  IF participant_id IS NOT NULL THEN
    FOR participant_record IN
      SELECT
        cp.id,
        cp.class_id,
        cp.student_enrollment_id,
        cp.created_at
      FROM class_participants cp
      WHERE cp.id = participant_id
        AND cp.status = 'active'
    LOOP
      -- Obtener detalles de la clase
      SELECT * INTO class_record
      FROM programmed_classes
      WHERE id = participant_record.class_id;

      -- Si la clase tiene precio mensual, generar pagos
      IF class_record.monthly_price IS NOT NULL AND class_record.monthly_price > 0 THEN
        current_month := EXTRACT(MONTH FROM class_record.start_date);
        current_year := EXTRACT(YEAR FROM class_record.start_date);
        end_month := EXTRACT(MONTH FROM class_record.end_date);
        end_year := EXTRACT(YEAR FROM class_record.end_date);

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
            total_payments := total_payments + 1;
          END IF;

          current_month := current_month + 1;
          IF current_month > 12 THEN
            current_month := 1;
            current_year := current_year + 1;
          END IF;
        END LOOP;

        participant_count := participant_count + 1;
      END IF;
    END LOOP;

    RETURN QUERY SELECT total_payments,
      format('Generados %s pagos para 1 participante', total_payments);
  ELSE
    -- Procesar todos los class_participants activos
    FOR participant_record IN
      SELECT
        cp.id,
        cp.class_id,
        cp.student_enrollment_id,
        cp.created_at
      FROM class_participants cp
      WHERE cp.status = 'active'
    LOOP
      SELECT * INTO class_record
      FROM programmed_classes
      WHERE id = participant_record.class_id;

      IF class_record.monthly_price IS NOT NULL AND class_record.monthly_price > 0 THEN
        current_month := EXTRACT(MONTH FROM class_record.start_date);
        current_year := EXTRACT(YEAR FROM class_record.start_date);
        end_month := EXTRACT(MONTH FROM class_record.end_date);
        end_year := EXTRACT(YEAR FROM class_record.end_date);

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
            total_payments := total_payments + 1;
          END IF;

          current_month := current_month + 1;
          IF current_month > 12 THEN
            current_month := 1;
            current_year := current_year + 1;
          END IF;
        END LOOP;

        participant_count := participant_count + 1;
      END IF;
    END LOOP;

    RETURN QUERY SELECT total_payments,
      format('Generados %s pagos para %s participantes', total_payments, participant_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins can call this)
GRANT EXECUTE ON FUNCTION generate_monthly_payments_for_participant TO authenticated;

-- Llamar la función para generar todos los pagos pendientes
SELECT * FROM generate_monthly_payments_for_participant();
