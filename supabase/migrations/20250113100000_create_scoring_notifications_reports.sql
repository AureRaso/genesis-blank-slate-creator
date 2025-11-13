-- ============================================
-- FASE 4: Sistema de Notificaciones y Reportes
-- ============================================
-- Este sistema gestiona:
-- - Notificaciones automáticas para rachas negativas
-- - Reportes mensuales automáticos
-- - Planes de acción sugeridos

-- ============================================
-- TABLA: student_score_notifications
-- ============================================
-- Almacena las notificaciones enviadas por problemas de asistencia
CREATE TABLE IF NOT EXISTS public.student_score_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,

  -- Tipo de notificación
  notification_type TEXT NOT NULL CHECK (notification_type IN ('negative_streak', 'low_score', 'multiple_no_shows', 'monthly_report')),

  -- Severidad
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),

  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_plan TEXT, -- Plan de acción sugerido

  -- Datos del score en ese momento
  score_at_notification INTEGER,
  no_shows_at_notification INTEGER,
  recent_failures_at_notification INTEGER,

  -- Estado
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,

  -- Notificación enviada
  sent_to_trainer BOOLEAN DEFAULT false,
  sent_to_student BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS student_score_notifications_student_idx ON public.student_score_notifications(student_enrollment_id);
CREATE INDEX IF NOT EXISTS student_score_notifications_type_idx ON public.student_score_notifications(notification_type);
CREATE INDEX IF NOT EXISTS student_score_notifications_severity_idx ON public.student_score_notifications(severity);
CREATE INDEX IF NOT EXISTS student_score_notifications_unread_idx ON public.student_score_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS student_score_notifications_unresolved_idx ON public.student_score_notifications(is_resolved) WHERE is_resolved = false;

-- ============================================
-- TABLA: monthly_attendance_reports
-- ============================================
-- Almacena reportes mensuales generados automáticamente
CREATE TABLE IF NOT EXISTS public.monthly_attendance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,

  -- Periodo del reporte
  report_month INTEGER NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  report_year INTEGER NOT NULL CHECK (report_year >= 2024),

  -- Estadísticas generales
  total_students INTEGER NOT NULL DEFAULT 0,
  students_excellent INTEGER NOT NULL DEFAULT 0,
  students_good INTEGER NOT NULL DEFAULT 0,
  students_regular INTEGER NOT NULL DEFAULT 0,
  students_problematic INTEGER NOT NULL DEFAULT 0,

  -- Totales
  total_classes_month INTEGER NOT NULL DEFAULT 0,
  total_no_shows_month INTEGER NOT NULL DEFAULT 0,
  total_confirmations_month INTEGER NOT NULL DEFAULT 0,

  -- Promedios
  average_score DECIMAL(5,2),
  average_attendance_rate DECIMAL(5,2),

  -- Alumnos destacados y problemáticos
  top_students JSONB, -- Array de {id, name, score}
  problematic_students JSONB, -- Array de {id, name, score, issues}

  -- Recomendaciones
  recommendations TEXT,

  -- Estado
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_to_trainers BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un reporte por mes por club
  UNIQUE(club_id, report_month, report_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS monthly_attendance_reports_club_idx ON public.monthly_attendance_reports(club_id);
CREATE INDEX IF NOT EXISTS monthly_attendance_reports_period_idx ON public.monthly_attendance_reports(report_year DESC, report_month DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- student_score_notifications
ALTER TABLE public.student_score_notifications ENABLE ROW LEVEL SECURITY;

-- Admins y trainers pueden ver todas las notificaciones
CREATE POLICY "Allow admins and trainers to view all notifications"
ON public.student_score_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- Admins y trainers pueden gestionar notificaciones
CREATE POLICY "Allow admins and trainers to manage notifications"
ON public.student_score_notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- monthly_attendance_reports
ALTER TABLE public.monthly_attendance_reports ENABLE ROW LEVEL SECURITY;

-- Admins y trainers pueden ver reportes
CREATE POLICY "Allow admins and trainers to view reports"
ON public.monthly_attendance_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- Solo admins pueden crear/modificar reportes
CREATE POLICY "Allow admins to manage reports"
ON public.monthly_attendance_reports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- FUNCIÓN: Generar plan de acción
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_action_plan(
  p_student_enrollment_id UUID,
  p_notification_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_score RECORD;
  v_action_plan TEXT;
BEGIN
  -- Obtener datos del score
  SELECT * INTO v_score
  FROM public.student_attendance_scores
  WHERE student_enrollment_id = p_student_enrollment_id;

  IF NOT FOUND THEN
    RETURN 'No hay datos suficientes para generar un plan de acción.';
  END IF;

  -- Generar plan según el tipo y datos
  v_action_plan := E'PLAN DE ACCIÓN SUGERIDO:\n\n';

  -- Racha negativa
  IF p_notification_type = 'negative_streak' THEN
    v_action_plan := v_action_plan || E'1. CONTACTO INMEDIATO:\n';
    v_action_plan := v_action_plan || E'   - Llamar al alumno para entender la situación\n';
    v_action_plan := v_action_plan || E'   - Verificar si hay problemas personales o de horario\n\n';

    v_action_plan := v_action_plan || E'2. SEGUIMIENTO:\n';
    v_action_plan := v_action_plan || E'   - Recordar la importancia de confirmar asistencia\n';
    v_action_plan := v_action_plan || E'   - Monitorear las próximas 3 clases\n\n';

    IF v_score.no_show_when_confirmed >= 3 THEN
      v_action_plan := v_action_plan || E'3. MEDIDAS ADICIONALES:\n';
      v_action_plan := v_action_plan || E'   - Considerar cambio de horario o grupo\n';
      v_action_plan := v_action_plan || E'   - Evaluar posible advertencia formal\n';
    END IF;
  END IF;

  -- Score bajo
  IF p_notification_type = 'low_score' THEN
    v_action_plan := v_action_plan || E'1. ANÁLISIS DE CAUSAS:\n';

    IF v_score.total_no_response > v_score.total_confirmed_attendance THEN
      v_action_plan := v_action_plan || E'   - Principal problema: Falta de comunicación\n';
      v_action_plan := v_action_plan || E'   - Recordar al alumno que debe confirmar siempre\n\n';
    END IF;

    IF v_score.no_show_when_confirmed > 0 THEN
      v_action_plan := v_action_plan || E'   - Problema crítico: No-shows (' || v_score.no_show_when_confirmed || E')\n';
      v_action_plan := v_action_plan || E'   - Enfatizar la importancia del compromiso\n\n';
    END IF;

    v_action_plan := v_action_plan || E'2. REUNIÓN INDIVIDUAL:\n';
    v_action_plan := v_action_plan || E'   - Explicar el sistema de scoring\n';
    v_action_plan := v_action_plan || E'   - Establecer compromisos claros\n';
  END IF;

  -- Múltiples no-shows
  IF p_notification_type = 'multiple_no_shows' THEN
    v_action_plan := v_action_plan || E'1. ACCIÓN INMEDIATA:\n';
    v_action_plan := v_action_plan || E'   - Reunión obligatoria con el alumno\n';
    v_action_plan := v_action_plan || E'   - Advertencia formal por escrito\n\n';

    v_action_plan := v_action_plan || E'2. CONSECUENCIAS:\n';
    v_action_plan := v_action_plan || E'   - Explicar posibles penalizaciones\n';
    v_action_plan := v_action_plan || E'   - Establecer período de prueba (2 semanas)\n\n';

    v_action_plan := v_action_plan || E'3. SEGUIMIENTO ESTRICTO:\n';
    v_action_plan := v_action_plan || E'   - Confirmar asistencia 24h antes de cada clase\n';
    v_action_plan := v_action_plan || E'   - Evaluar continuidad si no mejora\n';
  END IF;

  RETURN v_action_plan;
END;
$$;

-- ============================================
-- FUNCIÓN: Crear notificación automática
-- ============================================
CREATE OR REPLACE FUNCTION public.create_score_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_type TEXT;
  v_severity TEXT;
  v_title TEXT;
  v_message TEXT;
  v_action_plan TEXT;
  v_should_notify BOOLEAN := false;
BEGIN
  -- Verificar racha negativa (crítico)
  IF NEW.recent_streak_type = 'negative' AND NEW.recent_failures >= 2 THEN
    v_should_notify := true;
    v_notification_type := 'negative_streak';
    v_severity := 'critical';
    v_title := '🚨 Racha Negativa Detectada';
    v_message := 'El alumno ha confirmado asistencia pero no ha venido ' || NEW.recent_failures || ' de las últimas 3 clases.';
    v_action_plan := public.generate_action_plan(NEW.student_enrollment_id, 'negative_streak');
  END IF;

  -- Verificar múltiples no-shows (crítico)
  IF NEW.no_show_when_confirmed >= 3 AND (OLD IS NULL OR OLD.no_show_when_confirmed < 3) THEN
    v_should_notify := true;
    v_notification_type := 'multiple_no_shows';
    v_severity := 'critical';
    v_title := '⚠️ Múltiples No-Shows';
    v_message := 'El alumno ha acumulado ' || NEW.no_show_when_confirmed || ' no-shows (confirmó pero no vino).';
    v_action_plan := public.generate_action_plan(NEW.student_enrollment_id, 'multiple_no_shows');
  END IF;

  -- Verificar score bajo (warning)
  IF NEW.score < 60 AND NEW.score_category = 'problematic' AND (OLD IS NULL OR OLD.score_category != 'problematic') THEN
    v_should_notify := true;
    v_notification_type := 'low_score';
    v_severity := 'warning';
    v_title := '⚠️ Score Problemático';
    v_message := 'El score del alumno ha bajado a ' || NEW.score || ' puntos (categoría: Problemático).';
    v_action_plan := public.generate_action_plan(NEW.student_enrollment_id, 'low_score');
  END IF;

  -- Crear notificación si es necesario
  IF v_should_notify THEN
    INSERT INTO public.student_score_notifications (
      student_enrollment_id,
      notification_type,
      severity,
      title,
      message,
      action_plan,
      score_at_notification,
      no_shows_at_notification,
      recent_failures_at_notification
    ) VALUES (
      NEW.student_enrollment_id,
      v_notification_type,
      v_severity,
      v_title,
      v_message,
      v_action_plan,
      NEW.score,
      NEW.no_show_when_confirmed,
      NEW.recent_failures
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger para notificaciones automáticas
DROP TRIGGER IF EXISTS trigger_create_score_notification ON public.student_attendance_scores;
CREATE TRIGGER trigger_create_score_notification
AFTER INSERT OR UPDATE ON public.student_attendance_scores
FOR EACH ROW
EXECUTE FUNCTION public.create_score_notification();

-- ============================================
-- TRIGGER: Actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON public.student_score_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE public.student_score_notifications IS 'Notificaciones automáticas generadas por problemas de asistencia';
COMMENT ON TABLE public.monthly_attendance_reports IS 'Reportes mensuales automáticos con estadísticas de asistencia';
COMMENT ON FUNCTION public.generate_action_plan(UUID, TEXT) IS 'Genera un plan de acción personalizado según el problema detectado';
COMMENT ON FUNCTION public.create_score_notification() IS 'Trigger function que crea notificaciones automáticas cuando se detectan problemas';
