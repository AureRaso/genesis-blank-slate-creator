-- ============================================================================
-- MIGRACIÓN: Fix RPC get_students_weekly_hours (400 Bad Request)
-- ============================================================================
-- PROBLEMA: La función devuelve 400 porque:
--   1. Falta GRANT EXECUTE para el rol authenticated
--   2. DISTINCT ON requiere ORDER BY con las mismas columnas
-- ============================================================================

-- Recrear la función con DISTINCT ON + ORDER BY corregidos
CREATE OR REPLACE FUNCTION get_students_weekly_hours(p_club_id UUID)
RETURNS TABLE (
  student_enrollment_id UUID,
  weekly_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_participations AS (
    SELECT
      cp.student_enrollment_id,
      pc.id AS class_id,
      pc.days_of_week,
      pc.start_time,
      pc.duration_minutes
    FROM class_participants cp
    JOIN programmed_classes pc ON pc.id = cp.class_id
    JOIN student_enrollments se ON se.id = cp.student_enrollment_id
    WHERE se.club_id = p_club_id
      AND cp.status = 'active'
      AND pc.is_active = true
  ),
  unique_classes_per_student AS (
    SELECT DISTINCT ON (student_enrollment_id, class_id)
      student_enrollment_id,
      class_id,
      days_of_week,
      start_time,
      duration_minutes
    FROM active_participations
    ORDER BY student_enrollment_id, class_id
  ),
  expanded_slots AS (
    SELECT
      student_enrollment_id,
      unnest(days_of_week) AS day_of_week,
      start_time,
      duration_minutes
    FROM unique_classes_per_student
  ),
  unique_slots AS (
    SELECT DISTINCT ON (student_enrollment_id, day_of_week, start_time)
      student_enrollment_id,
      duration_minutes
    FROM expanded_slots
    ORDER BY student_enrollment_id, day_of_week, start_time
  )
  SELECT
    us.student_enrollment_id,
    ROUND(COALESCE(SUM(us.duration_minutes), 0) / 60.0, 1) AS weekly_hours
  FROM unique_slots us
  GROUP BY us.student_enrollment_id;
END;
$$;

-- Conceder permisos de ejecución al rol authenticated (requerido por PostgREST)
GRANT EXECUTE ON FUNCTION get_students_weekly_hours(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_weekly_hours(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_students_weekly_hours(UUID) TO service_role;
