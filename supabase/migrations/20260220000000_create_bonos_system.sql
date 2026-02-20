-- ============================================================================
-- MIGRATION: Create Bonos (Class Packs) System
-- ============================================================================
-- PURPOSE: Allow clubs to sell prepaid class packs to students
-- ============================================================================

-- ============================================================================
-- FEATURE FLAG: Add enable_bonos to clubs
-- ============================================================================
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS enable_bonos BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- TABLE: bono_templates (Plantillas de bonos por club)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bono_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pack configuration
  total_classes INTEGER NOT NULL CHECK (total_classes > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),

  -- Optional validity
  validity_days INTEGER CHECK (validity_days IS NULL OR validity_days > 0),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bono_templates_club ON bono_templates(club_id);
CREATE INDEX idx_bono_templates_active ON bono_templates(club_id, is_active);

-- Comments
COMMENT ON TABLE bono_templates IS 'Plantillas de bonos (packs de clases prepagados) configurables por club';
COMMENT ON COLUMN bono_templates.total_classes IS 'Numero total de clases del pack (5, 10, 20...)';
COMMENT ON COLUMN bono_templates.price IS 'Precio total del bono';
COMMENT ON COLUMN bono_templates.validity_days IS 'Dias de validez desde la compra (NULL = sin caducidad)';

-- ============================================================================
-- TABLE: student_bonos (Bonos asignados a alumnos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_bonos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  bono_template_id UUID NOT NULL REFERENCES bono_templates(id) ON DELETE RESTRICT,

  -- Pack tracking (snapshots from template at purchase time)
  total_classes INTEGER NOT NULL CHECK (total_classes > 0),
  remaining_classes INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL CHECK (price_paid > 0),

  -- Dates
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (status IN ('activo', 'agotado', 'expirado', 'cancelado')),

  -- Link to the payment record created at purchase
  payment_id UUID REFERENCES student_payments(id) ON DELETE SET NULL,

  -- Who assigned it
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: remaining cannot exceed total and must be >= 0
  CONSTRAINT valid_remaining CHECK (remaining_classes >= 0 AND remaining_classes <= total_classes)
);

-- Indexes
CREATE INDEX idx_student_bonos_club ON student_bonos(club_id);
CREATE INDEX idx_student_bonos_student ON student_bonos(student_enrollment_id);
CREATE INDEX idx_student_bonos_template ON student_bonos(bono_template_id);
CREATE INDEX idx_student_bonos_status ON student_bonos(status);
CREATE INDEX idx_student_bonos_active ON student_bonos(student_enrollment_id, status)
  WHERE status = 'activo';

-- Comments
COMMENT ON TABLE student_bonos IS 'Bonos (packs de clases) asignados a alumnos con tracking de clases restantes';
COMMENT ON COLUMN student_bonos.total_classes IS 'Snapshot del total de clases al comprar';
COMMENT ON COLUMN student_bonos.remaining_classes IS 'Clases restantes (se decrementa con cada uso)';
COMMENT ON COLUMN student_bonos.price_paid IS 'Snapshot del precio al comprar';
COMMENT ON COLUMN student_bonos.expires_at IS 'Fecha de caducidad (NULL = sin caducidad)';
COMMENT ON COLUMN student_bonos.payment_id IS 'Pago asociado en student_payments';

-- ============================================================================
-- TABLE: student_bono_usages (Historial de uso de bonos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_bono_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_bono_id UUID NOT NULL REFERENCES student_bonos(id) ON DELETE CASCADE,
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,

  -- What class was consumed
  class_participant_id UUID REFERENCES class_participants(id) ON DELETE SET NULL,
  class_id UUID REFERENCES programmed_classes(id) ON DELETE SET NULL,
  class_date DATE,

  -- Tracking
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reverted_at TIMESTAMPTZ,
  reverted_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bono_usages_bono ON student_bono_usages(student_bono_id);
CREATE INDEX idx_bono_usages_student ON student_bono_usages(student_enrollment_id);
CREATE INDEX idx_bono_usages_class ON student_bono_usages(class_id);
CREATE INDEX idx_bono_usages_participant ON student_bono_usages(class_participant_id);

-- Comments
COMMENT ON TABLE student_bono_usages IS 'Registro de cada uso (descuento) de clase de un bono';
COMMENT ON COLUMN student_bono_usages.reverted_at IS 'Si se revirtio el uso (ej: alumno eliminado de la clase)';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_bono_templates_updated_at ON bono_templates;
CREATE TRIGGER update_bono_templates_updated_at
  BEFORE UPDATE ON bono_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_bonos_updated_at ON student_bonos;
CREATE TRIGGER update_student_bonos_updated_at
  BEFORE UPDATE ON student_bonos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Deduct a class from a student's active bono
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_bono_class(
  p_student_enrollment_id UUID,
  p_class_participant_id UUID DEFAULT NULL,
  p_class_id UUID DEFAULT NULL,
  p_class_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bono student_bonos%ROWTYPE;
  v_usage_id UUID;
  v_bono_name TEXT;
BEGIN
  -- Find the best active bono for this student (nearest expiry first, then oldest first = FIFO)
  SELECT * INTO v_bono
  FROM student_bonos
  WHERE student_enrollment_id = p_student_enrollment_id
    AND status = 'activo'
    AND remaining_classes > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY
    expires_at ASC NULLS LAST,
    purchased_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_bono');
  END IF;

  -- Get the bono template name
  SELECT name INTO v_bono_name FROM bono_templates WHERE id = v_bono.bono_template_id;

  -- Decrement remaining classes
  UPDATE student_bonos
  SET remaining_classes = remaining_classes - 1,
      status = CASE WHEN remaining_classes - 1 = 0 THEN 'agotado' ELSE 'activo' END,
      updated_at = NOW()
  WHERE id = v_bono.id;

  -- Record usage
  INSERT INTO student_bono_usages (
    student_bono_id, student_enrollment_id,
    class_participant_id, class_id, class_date
  ) VALUES (
    v_bono.id, p_student_enrollment_id,
    p_class_participant_id, p_class_id, p_class_date
  )
  RETURNING id INTO v_usage_id;

  RETURN jsonb_build_object(
    'success', true,
    'bono_id', v_bono.id,
    'usage_id', v_usage_id,
    'remaining', v_bono.remaining_classes - 1,
    'bono_name', v_bono_name
  );
END;
$$;

COMMENT ON FUNCTION deduct_bono_class IS 'Descuenta 1 clase del bono activo mas antiguo del alumno. Usa FOR UPDATE para evitar race conditions.';

-- ============================================================================
-- FUNCTION: Revert a bono usage (when class is cancelled)
-- ============================================================================
CREATE OR REPLACE FUNCTION revert_bono_usage(
  p_usage_id UUID,
  p_reason TEXT DEFAULT 'Clase cancelada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage student_bono_usages%ROWTYPE;
  v_bono student_bonos%ROWTYPE;
BEGIN
  -- Find the usage that hasn't been reverted yet
  SELECT * INTO v_usage
  FROM student_bono_usages
  WHERE id = p_usage_id AND reverted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'usage_not_found_or_already_reverted');
  END IF;

  -- Mark usage as reverted
  UPDATE student_bono_usages
  SET reverted_at = NOW(), reverted_reason = p_reason
  WHERE id = p_usage_id;

  -- Restore the class to the bono
  UPDATE student_bonos
  SET remaining_classes = remaining_classes + 1,
      status = 'activo',
      updated_at = NOW()
  WHERE id = v_usage.student_bono_id
  RETURNING * INTO v_bono;

  RETURN jsonb_build_object(
    'success', true,
    'bono_id', v_bono.id,
    'remaining', v_bono.remaining_classes
  );
END;
$$;

COMMENT ON FUNCTION revert_bono_usage IS 'Revierte un uso de bono, restaurando 1 clase al bono. Usado cuando se cancela/elimina una clase.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_bono_class TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_bono_class TO service_role;
GRANT EXECUTE ON FUNCTION revert_bono_usage TO authenticated;
GRANT EXECUTE ON FUNCTION revert_bono_usage TO service_role;

-- ============================================================================
-- RLS POLICIES: bono_templates
-- ============================================================================
ALTER TABLE bono_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bono templates"
  ON bono_templates FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can create bono templates"
  ON bono_templates FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can update bono templates"
  ON bono_templates FOR UPDATE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can delete bono templates"
  ON bono_templates FOR DELETE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ============================================================================
-- RLS POLICIES: student_bonos
-- ============================================================================
ALTER TABLE student_bonos ENABLE ROW LEVEL SECURITY;

-- Admins can manage all bonos for their club
CREATE POLICY "Admins can view student bonos"
  ON student_bonos FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can create student bonos"
  ON student_bonos FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can update student bonos"
  ON student_bonos FOR UPDATE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can delete student bonos"
  ON student_bonos FOR DELETE
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Students can view their own bonos
CREATE POLICY "Students can view own bonos"
  ON student_bonos FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
  );

-- Guardians can view their dependents' bonos
CREATE POLICY "Guardians can view dependent bonos"
  ON student_bonos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: student_bono_usages
-- ============================================================================
ALTER TABLE student_bono_usages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all bono usages for their club
CREATE POLICY "Admins can view bono usages"
  ON student_bono_usages FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can create bono usages"
  ON student_bono_usages FOR INSERT
  WITH CHECK (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Admins can update bono usages"
  ON student_bono_usages FOR UPDATE
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.club_id = se.club_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Students can view their own bono usages
CREATE POLICY "Students can view own bono usages"
  ON student_bono_usages FOR SELECT
  USING (
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE p.id = auth.uid()
    )
  );

-- Guardians can view their dependents' bono usages
CREATE POLICY "Guardians can view dependent bono usages"
  ON student_bono_usages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    student_enrollment_id IN (
      SELECT se.id FROM student_enrollments se
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );