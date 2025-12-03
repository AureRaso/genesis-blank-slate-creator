-- Migración completa para implementar class_attendance_records
-- Este script hace lo siguiente:
-- 1. Crea la tabla class_attendance_records (si no existe)
-- 2. Limpia registros huérfanos de class_participants
-- 3. Migra datos existentes a la nueva tabla
-- 4. Mantiene class_participants como registro de inscripción base

-- PASO 1: Crear la tabla (si no existe - idempotente)
CREATE TABLE IF NOT EXISTS class_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_participant_id UUID NOT NULL REFERENCES class_participants(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  attendance_confirmed BOOLEAN DEFAULT FALSE,
  attendance_confirmed_at TIMESTAMPTZ,
  absence_confirmed BOOLEAN DEFAULT FALSE,
  absence_reason TEXT,
  absence_confirmed_at TIMESTAMPTZ,
  absence_locked BOOLEAN DEFAULT FALSE,
  confirmed_by_trainer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_participant_id, scheduled_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant ON class_attendance_records(class_participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON class_attendance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant_date ON class_attendance_records(class_participant_id, scheduled_date);

-- PASO 2: Limpiar registros huérfanos (class_participants de clases inactivas)
-- Primero identificamos y mostramos lo que vamos a borrar
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM class_participants cp
  LEFT JOIN programmed_classes pc ON pc.id = cp.class_id
  WHERE pc.id IS NULL OR pc.is_active = FALSE;

  RAISE NOTICE 'Encontrados % registros huérfanos de class_participants para eliminar', orphan_count;

  -- Eliminar registros huérfanos
  DELETE FROM class_participants cp
  USING programmed_classes pc
  WHERE cp.class_id = pc.id
    AND pc.is_active = FALSE;

  -- Eliminar registros sin clase
  DELETE FROM class_participants cp
  WHERE NOT EXISTS (
    SELECT 1 FROM programmed_classes pc WHERE pc.id = cp.class_id
  );

  RAISE NOTICE 'Registros huérfanos eliminados';
END $$;

-- PASO 3: Migrar datos existentes de attendance_confirmed_for_date a class_attendance_records
-- Solo migrar participantes de clases activas
INSERT INTO class_attendance_records (
  class_participant_id,
  scheduled_date,
  attendance_confirmed,
  attendance_confirmed_at,
  absence_confirmed,
  absence_reason,
  absence_confirmed_at,
  absence_locked,
  confirmed_by_trainer,
  created_at
)
SELECT
  cp.id,
  cp.attendance_confirmed_for_date,
  TRUE, -- Si tiene fecha confirmada, entonces está confirmado
  cp.attendance_confirmed_at,
  cp.absence_confirmed,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.absence_locked,
  cp.confirmed_by_trainer,
  COALESCE(cp.attendance_confirmed_at, NOW())
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.is_active = TRUE
  AND cp.attendance_confirmed_for_date IS NOT NULL
  AND cp.status = 'active'
ON CONFLICT (class_participant_id, scheduled_date) DO NOTHING;

-- Migrar ausencias confirmadas (aunque no tengan fecha de attendance)
INSERT INTO class_attendance_records (
  class_participant_id,
  scheduled_date,
  attendance_confirmed,
  attendance_confirmed_at,
  absence_confirmed,
  absence_reason,
  absence_confirmed_at,
  absence_locked,
  confirmed_by_trainer,
  created_at
)
SELECT
  cp.id,
  CURRENT_DATE, -- Asumimos que la ausencia es para hoy si no hay fecha específica
  FALSE,
  NULL,
  TRUE,
  cp.absence_reason,
  cp.absence_confirmed_at,
  cp.absence_locked,
  FALSE,
  COALESCE(cp.absence_confirmed_at, NOW())
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
WHERE pc.is_active = TRUE
  AND cp.absence_confirmed = TRUE
  AND cp.attendance_confirmed_for_date IS NULL
  AND cp.status = 'active'
ON CONFLICT (class_participant_id, scheduled_date) DO NOTHING;

-- PASO 4: Habilitar RLS
ALTER TABLE class_attendance_records ENABLE ROW LEVEL SECURITY;

-- PASO 5: Políticas RLS (DROP IF EXISTS para idempotencia)
DROP POLICY IF EXISTS "Students can view own attendance records" ON class_attendance_records;
CREATE POLICY "Students can view own attendance records"
  ON class_attendance_records FOR SELECT
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can update own attendance" ON class_attendance_records;
CREATE POLICY "Students can update own attendance"
  ON class_attendance_records FOR UPDATE
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can insert own attendance" ON class_attendance_records;
CREATE POLICY "Students can insert own attendance"
  ON class_attendance_records FOR INSERT
  WITH CHECK (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Trainers can view class attendance" ON class_attendance_records;
CREATE POLICY "Trainers can view class attendance"
  ON class_attendance_records FOR SELECT
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Trainers can manage class attendance" ON class_attendance_records;
CREATE POLICY "Trainers can manage class attendance"
  ON class_attendance_records FOR ALL
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Club admins can manage attendance" ON class_attendance_records;
CREATE POLICY "Club admins can manage attendance"
  ON class_attendance_records FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.user_type IN ('club_admin', 'admin')
    )
  );

-- PASO 6: Función para auto-crear registros de attendance cuando sea necesario
CREATE OR REPLACE FUNCTION ensure_attendance_record(
  p_class_participant_id UUID,
  p_scheduled_date DATE
) RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Intentar obtener el registro existente
  SELECT id INTO v_record_id
  FROM class_attendance_records
  WHERE class_participant_id = p_class_participant_id
    AND scheduled_date = p_scheduled_date;

  -- Si no existe, crearlo
  IF v_record_id IS NULL THEN
    INSERT INTO class_attendance_records (
      class_participant_id,
      scheduled_date
    ) VALUES (
      p_class_participant_id,
      p_scheduled_date
    )
    RETURNING id INTO v_record_id;
  END IF;

  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE class_attendance_records IS 'Registros de asistencia/ausencia por fecha específica. Permite que clases recurrentes tengan registros independientes por cada sesión.';
COMMENT ON FUNCTION ensure_attendance_record IS 'Función helper para asegurar que existe un registro de attendance para una fecha específica. Crea el registro si no existe.';

-- PASO 7: Reporte final
DO $$
DECLARE
  participant_count INTEGER;
  attendance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO participant_count FROM class_participants cp
  JOIN programmed_classes pc ON pc.id = cp.class_id
  WHERE pc.is_active = TRUE;

  SELECT COUNT(*) INTO attendance_count FROM class_attendance_records;

  RAISE NOTICE '✅ Migración completada:';
  RAISE NOTICE '   - Class participants activos: %', participant_count;
  RAISE NOTICE '   - Attendance records creados: %', attendance_count;
END $$;
