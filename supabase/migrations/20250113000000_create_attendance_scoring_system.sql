-- ============================================
-- FASE 2: Sistema de Scoring de Asistencia
-- ============================================
-- Este sistema calcula un score (0-100) para cada alumno basado en:
-- - Cumplimiento de confirmaciones (40 puntos)
-- - Comunicación (30 puntos)
-- - Patrón de cancelaciones (20 puntos)
-- - Bonus por estabilidad (10 puntos)
-- - Penalizaciones por no-shows y rachas negativas

-- ============================================
-- TABLA: student_attendance_scores
-- ============================================
-- Almacena el score actual de cada alumno
CREATE TABLE IF NOT EXISTS public.student_attendance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,

  -- SCORE PRINCIPAL (0-100)
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_category TEXT NOT NULL DEFAULT 'regular' CHECK (score_category IN ('excellent', 'good', 'regular', 'problematic')),

  -- MÉTRICAS PRINCIPALES
  total_classes INTEGER NOT NULL DEFAULT 0,
  total_confirmed_attendance INTEGER NOT NULL DEFAULT 0,
  total_confirmed_absence INTEGER NOT NULL DEFAULT 0,
  total_no_response INTEGER NOT NULL DEFAULT 0,

  -- CUMPLIMIENTO (lo que pasó realmente)
  actually_attended_when_confirmed INTEGER NOT NULL DEFAULT 0,  -- Confirmó y vino
  no_show_when_confirmed INTEGER NOT NULL DEFAULT 0,            -- Confirmó pero no vino (CRÍTICO)
  attended_without_confirmation INTEGER NOT NULL DEFAULT 0,      -- No confirmó pero vino
  absent_without_confirmation INTEGER NOT NULL DEFAULT 0,        -- No confirmó y no vino

  -- CLASES CANCELADAS POR ACADEMIA
  classes_cancelled_by_academy INTEGER NOT NULL DEFAULT 0,

  -- CONTEXTO
  is_in_fixed_class BOOLEAN DEFAULT false,

  -- TENDENCIA RECIENTE (últimas 3 clases)
  recent_streak_type TEXT CHECK (recent_streak_type IN ('positive', 'negative', 'neutral', 'unknown')),
  recent_failures INTEGER NOT NULL DEFAULT 0,  -- Fallos en últimas 3

  -- COMPONENTES DEL SCORE
  score_fulfillment DECIMAL(5,2) DEFAULT 0,    -- Cumplimiento (40 pts max)
  score_communication DECIMAL(5,2) DEFAULT 0,  -- Comunicación (30 pts max)
  score_cancellation DECIMAL(5,2) DEFAULT 0,   -- Cancelaciones (20 pts max)
  score_stability_bonus DECIMAL(5,2) DEFAULT 0, -- Bonus estabilidad (10 pts max)
  score_penalties DECIMAL(5,2) DEFAULT 0,       -- Penalizaciones

  -- METADATA
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_method TEXT DEFAULT 'manual',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un solo score por alumno
  UNIQUE(student_enrollment_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS student_attendance_scores_score_idx ON public.student_attendance_scores(score DESC);
CREATE INDEX IF NOT EXISTS student_attendance_scores_category_idx ON public.student_attendance_scores(score_category);
CREATE INDEX IF NOT EXISTS student_attendance_scores_student_idx ON public.student_attendance_scores(student_enrollment_id);

-- ============================================
-- TABLA: student_attendance_score_history
-- ============================================
-- Almacena la evolución del score en el tiempo para gráficas
CREATE TABLE IF NOT EXISTS public.student_attendance_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,

  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_category TEXT NOT NULL CHECK (score_category IN ('excellent', 'good', 'regular', 'problematic')),

  -- Snapshot de métricas en ese momento
  total_classes INTEGER NOT NULL,
  no_show_when_confirmed INTEGER NOT NULL,

  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para student_attendance_score_history
CREATE INDEX IF NOT EXISTS student_attendance_score_history_student_idx ON public.student_attendance_score_history(student_enrollment_id);
CREATE INDEX IF NOT EXISTS student_attendance_score_history_date_idx ON public.student_attendance_score_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS student_attendance_score_history_student_date_idx ON public.student_attendance_score_history(student_enrollment_id, recorded_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- student_attendance_scores
ALTER TABLE public.student_attendance_scores ENABLE ROW LEVEL SECURITY;

-- Admins y trainers pueden ver todos los scores
CREATE POLICY "Allow admins and trainers to view all scores"
ON public.student_attendance_scores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- Admins y trainers pueden actualizar scores
CREATE POLICY "Allow admins and trainers to update scores"
ON public.student_attendance_scores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- student_attendance_score_history
ALTER TABLE public.student_attendance_score_history ENABLE ROW LEVEL SECURITY;

-- Admins y trainers pueden ver todo el historial
CREATE POLICY "Allow admins and trainers to view score history"
ON public.student_attendance_score_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- Admins y trainers pueden insertar historial
CREATE POLICY "Allow admins and trainers to insert score history"
ON public.student_attendance_score_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'trainer')
  )
);

-- ============================================
-- FUNCIÓN: Calcular categoría del score
-- ============================================
CREATE OR REPLACE FUNCTION public.get_score_category(score_value INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF score_value >= 90 THEN
    RETURN 'excellent';
  ELSIF score_value >= 75 THEN
    RETURN 'good';
  ELSIF score_value >= 60 THEN
    RETURN 'regular';
  ELSE
    RETURN 'problematic';
  END IF;
END;
$$;

-- ============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_student_attendance_scores_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_student_attendance_scores_timestamp
BEFORE UPDATE ON public.student_attendance_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_student_attendance_scores_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE public.student_attendance_scores IS 'Almacena el score actual (0-100) de cada alumno basado en su comportamiento de asistencia';
COMMENT ON TABLE public.student_attendance_score_history IS 'Historial de evolución de scores para gráficas y análisis temporal';
COMMENT ON FUNCTION public.get_score_category(INTEGER) IS 'Convierte un score numérico en categoría: excellent (90+), good (75+), regular (60+), problematic (<60)';
