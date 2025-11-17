-- =====================================================
-- REDISEÑO COMPLETO: Sistema de Pagos Mensuales
-- =====================================================
-- LÓGICA:
-- - 1 pago por estudiante por mes (NO por clase)
-- - El precio se calcula según el número de clases ese mes
-- - Ejemplo: 4 clases en noviembre = 40€ (10€/clase)
--           2 clases en diciembre = 20€ (10€/clase)
-- =====================================================

-- PASO 1: Eliminar tabla anterior si existe
DROP TABLE IF EXISTS monthly_payments CASCADE;

-- PASO 2: Crear nueva tabla con estructura correcta
CREATE TABLE monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),

  -- Precio base por clase (ej: 10€)
  price_per_class NUMERIC(10,2) NOT NULL DEFAULT 10.00,

  -- Número de clases ese mes
  total_classes INTEGER NOT NULL DEFAULT 0,

  -- Monto total = price_per_class * total_classes
  total_amount NUMERIC(10,2) NOT NULL,

  -- Detalles de las clases incluidas (JSON)
  classes_details JSONB DEFAULT '[]'::jsonb,

  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'pagado')),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'bizum', 'transferencia', 'tarjeta')),
  marked_paid_at TIMESTAMPTZ,
  verified_paid_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un estudiante solo puede tener un pago por mes
  UNIQUE(student_enrollment_id, month, year)
);

-- PASO 3: Crear índices
CREATE INDEX idx_monthly_payments_student ON monthly_payments(student_enrollment_id);
CREATE INDEX idx_monthly_payments_month_year ON monthly_payments(month, year);
CREATE INDEX idx_monthly_payments_status ON monthly_payments(status);

-- PASO 4: Habilitar RLS
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;

-- PASO 5: Políticas de seguridad
CREATE POLICY "Players can view their own monthly payments"
  ON monthly_payments FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Players can mark their payments as paid"
  ON monthly_payments FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
    AND status = 'pendiente'
  )
  WITH CHECK (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
    AND status IN ('en_revision')
  );

CREATE POLICY "Admins and trainers can view all club payments"
  ON monthly_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'trainer')
      AND p.club_id IN (
        SELECT se.club_id FROM student_enrollments se
        WHERE se.id = monthly_payments.student_enrollment_id
      )
    )
  );

CREATE POLICY "Admins and trainers can verify payments"
  ON monthly_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'trainer')
      AND p.club_id IN (
        SELECT se.club_id FROM student_enrollments se
        WHERE se.id = monthly_payments.student_enrollment_id
      )
    )
  );

CREATE POLICY "System can insert monthly payments"
  ON monthly_payments FOR INSERT
  WITH CHECK (true);

-- PASO 6: Función para calcular y generar pagos mensuales de un estudiante
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

-- PASO 7: Trigger para actualizar pagos cuando cambian las clases
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
      10.00 -- Precio por clase por defecto
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM calculate_and_create_monthly_payment(
      OLD.student_enrollment_id,
      v_month,
      v_year,
      10.00
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_payment_on_class_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payment_on_class_change();

-- PASO 8: Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_monthly_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_payments_updated_at_trigger
  BEFORE UPDATE ON monthly_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payments_updated_at();

-- =====================================================
-- PASO 9: Generar pagos para clase "test -pista 2"
-- =====================================================
DO $$
DECLARE
  v_student_record RECORD;
  v_month_year_record RECORD;
  v_payments_created INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GENERANDO PAGOS MENSUALES AGRUPADOS';
  RAISE NOTICE '========================================';

  -- Para cada estudiante en las clases "test -pista 2"
  FOR v_student_record IN
    SELECT DISTINCT cp.student_enrollment_id, se.full_name, se.email
    FROM class_participants cp
    JOIN student_enrollments se ON se.id = cp.student_enrollment_id
    JOIN programmed_classes pc ON pc.id = cp.class_id
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.name ILIKE '%test%pista%2%'
      AND c.name ILIKE '%gali%'
      AND cp.status = 'active'
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Estudiante: % (%)', v_student_record.full_name, v_student_record.email;

    -- Para cada mes donde el estudiante tiene clases
    FOR v_month_year_record IN
      SELECT DISTINCT
        EXTRACT(MONTH FROM pc.start_date)::INTEGER as month,
        EXTRACT(YEAR FROM pc.start_date)::INTEGER as year
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE cp.student_enrollment_id = v_student_record.student_enrollment_id
        AND cp.status = 'active'
      ORDER BY year, month
    LOOP
      DECLARE
        v_payment_id UUID;
      BEGIN
        v_payment_id := calculate_and_create_monthly_payment(
          v_student_record.student_enrollment_id,
          v_month_year_record.month,
          v_month_year_record.year,
          10.00
        );

        IF v_payment_id IS NOT NULL THEN
          v_payments_created := v_payments_created + 1;

          -- Mostrar detalles del pago creado
          DECLARE
            v_payment RECORD;
          BEGIN
            SELECT * INTO v_payment
            FROM monthly_payments
            WHERE id = v_payment_id;

            RAISE NOTICE '    ✅ Pago creado: Mes %, Año %', v_month_year_record.month, v_month_year_record.year;
            RAISE NOTICE '       - Clases: %', v_payment.total_classes;
            RAISE NOTICE '       - Precio por clase: %€', v_payment.price_per_class;
            RAISE NOTICE '       - Total: %€', v_payment.total_amount;
          END;
        END IF;
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Total de pagos creados: %', v_payments_created;
  RAISE NOTICE '========================================';
END $$;

-- PASO 10: Verificar los pagos creados
SELECT
  mp.id,
  se.full_name as estudiante,
  se.email,
  mp.month,
  mp.year,
  mp.total_classes as num_clases,
  mp.price_per_class as precio_por_clase,
  mp.total_amount as total,
  mp.status,
  mp.classes_details
FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
ORDER BY se.full_name, mp.year, mp.month;
