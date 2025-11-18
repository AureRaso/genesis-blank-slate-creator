-- =====================================================
-- FIX: Eliminar triggers antiguos y recrear correctamente
-- =====================================================

-- PASO 1: Eliminar trigger y función antiguos
DROP TRIGGER IF EXISTS generate_monthly_payments_on_enrollment ON class_participants;
DROP FUNCTION IF EXISTS generate_monthly_payments_for_enrollment() CASCADE;

-- PASO 2: Eliminar trigger de actualización antiguo (múltiples variantes)
DROP TRIGGER IF EXISTS update_monthly_payment_on_class_change ON class_participants;
DROP TRIGGER IF EXISTS update_monthly_payment_on_class_change_trigger ON class_participants;
DROP FUNCTION IF EXISTS update_monthly_payment_on_class_change() CASCADE;

-- PASO 3: Crear función para calcular y crear pagos mensuales
CREATE OR REPLACE FUNCTION calculate_and_create_monthly_payment(
  p_student_enrollment_id UUID,
  p_month INTEGER,
  p_year INTEGER,
  p_price_per_class NUMERIC DEFAULT 10.00
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_class_count INTEGER;
  v_total_amount NUMERIC;
  v_classes_details JSONB;
BEGIN
  -- Contar cuántas clases tiene el estudiante ese mes
  SELECT COUNT(*), jsonb_agg(
    jsonb_build_object(
      'class_id', pc.id,
      'class_name', pc.name,
      'class_date', pc.start_date,
      'start_time', pc.start_time,
      'duration_minutes', pc.duration_minutes
    )
  )
  INTO v_class_count, v_classes_details
  FROM class_participants cp
  JOIN programmed_classes pc ON pc.id = cp.class_id
  WHERE cp.student_enrollment_id = p_student_enrollment_id
    AND cp.status = 'active'
    AND EXTRACT(MONTH FROM pc.start_date) = p_month
    AND EXTRACT(YEAR FROM pc.start_date) = p_year;

  -- Si no hay clases, no crear pago
  IF v_class_count = 0 THEN
    RETURN NULL;
  END IF;

  -- Calcular monto total
  v_total_amount := p_price_per_class * v_class_count;

  -- Insertar o actualizar el pago mensual
  INSERT INTO monthly_payments (
    student_enrollment_id,
    month,
    year,
    price_per_class,
    total_classes,
    total_amount,
    classes_details,
    status
  ) VALUES (
    p_student_enrollment_id,
    p_month,
    p_year,
    p_price_per_class,
    v_class_count,
    v_total_amount,
    COALESCE(v_classes_details, '[]'::jsonb),
    'pendiente'
  )
  ON CONFLICT (student_enrollment_id, month, year)
  DO UPDATE SET
    total_classes = v_class_count,
    total_amount = v_total_amount,
    classes_details = COALESCE(v_classes_details, '[]'::jsonb),
    price_per_class = p_price_per_class,
    updated_at = NOW()
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Trigger para actualizar pagos cuando cambian las clases
CREATE OR REPLACE FUNCTION update_monthly_payment_on_class_change()
RETURNS TRIGGER AS $$
DECLARE
  v_month INTEGER;
  v_year INTEGER;
BEGIN
  -- Obtener mes y año de la clase
  SELECT
    EXTRACT(MONTH FROM pc.start_date)::INTEGER,
    EXTRACT(YEAR FROM pc.start_date)::INTEGER
  INTO v_month, v_year
  FROM programmed_classes pc
  WHERE pc.id = COALESCE(NEW.class_id, OLD.class_id);

  -- Recalcular pago para ese mes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM calculate_and_create_monthly_payment(
      NEW.student_enrollment_id,
      v_month,
      v_year,
      10.00  -- Precio por clase por defecto
    );
  END IF;

  -- Si se elimina o desactiva, recalcular también
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status != 'active') THEN
    PERFORM calculate_and_create_monthly_payment(
      COALESCE(NEW.student_enrollment_id, OLD.student_enrollment_id),
      v_month,
      v_year,
      10.00
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Crear trigger
CREATE TRIGGER update_monthly_payment_on_class_change
  AFTER INSERT OR UPDATE OR DELETE ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payment_on_class_change();

-- =====================================================
-- FIN DE LA CORRECCIÓN
-- =====================================================
