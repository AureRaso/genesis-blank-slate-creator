# Pasos para Configurar el Sistema de Pagos Mensuales

Ejecuta estos scripts SQL manualmente en el **SQL Editor de Supabase** (https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/sql/new)

---

## PASO 1: Crear la tabla monthly_payments

```sql
-- Create monthly_payments table
CREATE TABLE IF NOT EXISTS monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'pagado')),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'bizum', 'transferencia', 'tarjeta')),
  marked_paid_at TIMESTAMPTZ,
  verified_paid_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_enrollment_id, class_id, month, year)
);
```

---

## PASO 2: Crear índices para performance

```sql
CREATE INDEX IF NOT EXISTS idx_monthly_payments_student ON monthly_payments(student_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_class ON monthly_payments(class_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_month_year ON monthly_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_status ON monthly_payments(status);
```

---

## PASO 3: Habilitar RLS (Row Level Security)

```sql
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;
```

---

## PASO 4: Crear políticas de seguridad

```sql
-- Policy for players to view their own payments
CREATE POLICY "Players can view their own monthly payments"
  ON monthly_payments
  FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE user_id = auth.uid()
    )
  );

-- Policy for players to update their own payments (only to mark as paid)
CREATE POLICY "Players can mark their payments as paid"
  ON monthly_payments
  FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE user_id = auth.uid()
    )
    AND status = 'pendiente'
  )
  WITH CHECK (
    student_enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE user_id = auth.uid()
    )
    AND status IN ('en_revision')
  );

-- Policy for admins/trainers to view all payments in their club
CREATE POLICY "Admins and trainers can view all club payments"
  ON monthly_payments
  FOR SELECT
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

-- Policy for admins/trainers to update payment status
CREATE POLICY "Admins and trainers can verify payments"
  ON monthly_payments
  FOR UPDATE
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

-- Policy for system to insert payments
CREATE POLICY "Admins can insert monthly payments"
  ON monthly_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
```

---

## PASO 5: Crear función para auto-actualizar updated_at

```sql
CREATE OR REPLACE FUNCTION update_monthly_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_payments_updated_at
  BEFORE UPDATE ON monthly_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payments_updated_at();
```

---

## PASO 6: Crear función para generar pagos automáticamente

```sql
CREATE OR REPLACE FUNCTION generate_monthly_payments_for_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  class_record RECORD;
  current_month INTEGER;
  current_year INTEGER;
  end_month INTEGER;
  end_year INTEGER;
BEGIN
  SELECT * INTO class_record FROM programmed_classes WHERE id = NEW.class_id;

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
      NEW.student_enrollment_id,
      NEW.class_id,
      current_month,
      current_year,
      class_record.monthly_price,
      'pendiente'
    )
    ON CONFLICT (student_enrollment_id, class_id, month, year) DO NOTHING;

    current_month := current_month + 1;
    IF current_month > 12 THEN
      current_month := 1;
      current_year := current_year + 1;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_monthly_payments_on_enrollment
  AFTER INSERT ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION generate_monthly_payments_for_enrollment();
```

---

## PASO 7: Generar pagos para class_participants EXISTENTES

```sql
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
          payments_generated := payments_generated + 1;
        END IF;

        current_month := current_month + 1;
        IF current_month > 12 THEN
          current_month := 1;
          current_year := current_year + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'Pagos mensuales generados: %', payments_generated;
END $$;
```

---

## PASO 8 (OPCIONAL): Verificar los pagos generados

```sql
-- Ver todos los pagos generados
SELECT
  mp.*,
  se.full_name as student_name,
  pc.name as class_name
FROM monthly_payments mp
JOIN student_enrollments se ON mp.student_enrollment_id = se.id
JOIN programmed_classes pc ON mp.class_id = pc.id
ORDER BY mp.year DESC, mp.month DESC;

-- Ver resumen por estudiante
SELECT
  se.full_name,
  se.email,
  COUNT(*) as total_payments,
  SUM(CASE WHEN mp.status = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN mp.status = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
  SUM(CASE WHEN mp.status = 'pagado' THEN 1 ELSE 0 END) as pagados,
  SUM(CASE WHEN mp.status = 'pendiente' THEN mp.amount ELSE 0 END) as total_pendiente
FROM monthly_payments mp
JOIN student_enrollments se ON mp.student_enrollment_id = se.id
GROUP BY se.id, se.full_name, se.email
ORDER BY se.full_name;
```

---

## PASO 9: Verificar pagos del jugador gal@vmi.com específicamente

```sql
-- Buscar el student_enrollment de gal@vmi.com
SELECT
  se.*,
  p.email as user_email
FROM student_enrollments se
JOIN profiles p ON se.user_id = p.id
WHERE p.email ILIKE '%gal%';

-- Ver pagos de ese estudiante (reemplaza el ID con el que encuentres arriba)
SELECT
  mp.*,
  pc.name as class_name,
  pc.monthly_price
FROM monthly_payments mp
JOIN programmed_classes pc ON mp.class_id = pc.id
WHERE mp.student_enrollment_id = 'TU_STUDENT_ENROLLMENT_ID_AQUI'
ORDER BY mp.year DESC, mp.month DESC;
```

---

## Notas Importantes

1. **Ejecuta los pasos en orden**: Los pasos están ordenados para evitar errores de dependencias
2. **Verifica cada paso**: Después de cada paso, asegúrate de que no hay errores
3. **PASO 7 es crítico**: Este paso genera los pagos para todos los estudiantes ya inscritos
4. **Si algo falla**: Puedes eliminar la tabla y volver a empezar con: `DROP TABLE IF EXISTS monthly_payments CASCADE;`

---

## ¿Cómo usar el sistema después?

1. **Jugadores**: Acceden a `/dashboard/my-payments` para ver y marcar sus pagos
2. **Estados de pago**:
   - `pendiente`: El jugador todavía no ha pagado
   - `en_revision`: El jugador marcó que pagó, esperando confirmación del profesor
   - `pagado`: El profesor confirmó el pago
3. **Próximo paso**: Crear dashboard para profesores/admins para confirmar pagos
