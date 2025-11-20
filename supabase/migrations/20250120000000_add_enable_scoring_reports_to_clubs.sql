-- Add field to enable/disable scoring and reports functionality per club
-- This allows clubs to opt-in to the attendance scoring and reporting system

ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS enable_scoring_reports BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN clubs.enable_scoring_reports IS 'Habilita el sistema de scoring de asistencia, notificaciones automáticas y reportes mensuales para este club. Solo los clubes con esta opción activada verán las métricas de asistencia de sus alumnos.';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_clubs_enable_scoring_reports ON clubs(enable_scoring_reports);

-- Update RLS policies for scoring-related tables to check if club has this feature enabled
-- This ensures that only clubs with scoring enabled can access these features

-- Update student_attendance_scores RLS
DROP POLICY IF EXISTS "Allow admins and trainers to view scores" ON public.student_attendance_scores;
CREATE POLICY "Allow admins and trainers to view scores"
ON public.student_attendance_scores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.student_enrollments se ON se.id = student_attendance_scores.student_enrollment_id
    INNER JOIN public.clubs c ON c.id = se.club_id
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'trainer')
    AND c.enable_scoring_reports = true
  )
);

-- Update student_score_notifications RLS
DROP POLICY IF EXISTS "Allow admins and trainers to view all notifications" ON public.student_score_notifications;
CREATE POLICY "Allow admins and trainers to view all notifications"
ON public.student_score_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.student_enrollments se ON se.id = student_score_notifications.student_enrollment_id
    INNER JOIN public.clubs c ON c.id = se.club_id
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'trainer')
    AND c.enable_scoring_reports = true
  )
);

DROP POLICY IF EXISTS "Allow admins and trainers to manage notifications" ON public.student_score_notifications;
CREATE POLICY "Allow admins and trainers to manage notifications"
ON public.student_score_notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.student_enrollments se ON se.id = student_score_notifications.student_enrollment_id
    INNER JOIN public.clubs c ON c.id = se.club_id
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'trainer')
    AND c.enable_scoring_reports = true
  )
);

-- Update monthly_attendance_reports RLS
DROP POLICY IF EXISTS "Allow admins and trainers to view reports" ON public.monthly_attendance_reports;
CREATE POLICY "Allow admins and trainers to view reports"
ON public.monthly_attendance_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.clubs c ON c.id = monthly_attendance_reports.club_id
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'trainer')
    AND c.enable_scoring_reports = true
  )
);

DROP POLICY IF EXISTS "Allow admins to manage reports" ON public.monthly_attendance_reports;
CREATE POLICY "Allow admins to manage reports"
ON public.monthly_attendance_reports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.clubs c ON c.id = monthly_attendance_reports.club_id
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND c.enable_scoring_reports = true
  )
);

-- Update the create_score_notification function to only create notifications for clubs with scoring enabled
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
  v_scoring_enabled BOOLEAN;
BEGIN
  -- Check if scoring is enabled for this club
  SELECT c.enable_scoring_reports INTO v_scoring_enabled
  FROM public.student_enrollments se
  INNER JOIN public.clubs c ON c.id = se.club_id
  WHERE se.id = NEW.student_enrollment_id;

  -- Only process if scoring is enabled
  IF NOT v_scoring_enabled THEN
    RETURN NEW;
  END IF;

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
