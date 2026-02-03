-- ============================================================================
-- MIGRACIÓN: Función RPC para calcular horas semanales por alumno
-- ============================================================================
-- PROBLEMA: La query del frontend a class_participants se trunca a 1000 filas
--           (límite por defecto de PostgREST/Supabase), lo que causa que muchos
--           alumnos muestren 0h en la página de asignación de tarifas.
--           Un club con 100 alumnos puede tener 3000+ participaciones.
-- ============================================================================
-- SOLUCIÓN: Calcular las horas semanales directamente en PostgreSQL,
--           devolviendo solo el resultado por alumno (1 fila por alumno).
-- ============================================================================

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
    -- Get all active participations for students in this club
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
    -- Deduplicate by class_id per student (a student may have multiple
    -- participation records for the same class)
    SELECT DISTINCT ON (student_enrollment_id, class_id)
      student_enrollment_id,
      class_id,
      days_of_week,
      start_time,
      duration_minutes
    FROM active_participations
  ),
  expanded_slots AS (
    -- Expand days_of_week array into individual day+time slots
    SELECT
      student_enrollment_id,
      unnest(days_of_week) AS day_of_week,
      start_time,
      duration_minutes
    FROM unique_classes_per_student
  ),
  unique_slots AS (
    -- Deduplicate by student + day + time (same time slot counts once)
    SELECT DISTINCT ON (student_enrollment_id, day_of_week, start_time)
      student_enrollment_id,
      duration_minutes
    FROM expanded_slots
  )
  -- Sum duration per student and convert to hours
  SELECT
    us.student_enrollment_id,
    ROUND(COALESCE(SUM(us.duration_minutes), 0) / 60.0, 1) AS weekly_hours
  FROM unique_slots us
  GROUP BY us.student_enrollment_id;
END;
$$;

COMMENT ON FUNCTION get_students_weekly_hours(UUID) IS
'Calcula las horas semanales de clase para cada alumno de un club.
Deduplica por class_id y por slot (día+hora) para evitar contar doble.
Devuelve solo alumnos con horas > 0.
Usado en la página de asignación de tarifas.';
