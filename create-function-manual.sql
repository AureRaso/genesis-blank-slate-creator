-- Ejecuta este SQL directamente en Supabase Dashboard (SQL Editor)
-- https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/editor

CREATE OR REPLACE FUNCTION get_student_classes_today(
  p_student_email TEXT
)
RETURNS TABLE (
  class_name TEXT,
  start_time TIME,
  end_time TIME,
  location TEXT,
  attendance_confirmed BOOLEAN,
  absence_confirmed BOOLEAN
)
SECURITY DEFINER
AS $$
DECLARE
  v_today_day TEXT;
BEGIN
  -- Get today's day name in Spanish
  v_today_day := CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'lunes'
    WHEN 2 THEN 'martes'
    WHEN 3 THEN 'miércoles'
    WHEN 4 THEN 'jueves'
    WHEN 5 THEN 'viernes'
    WHEN 6 THEN 'sábado'
  END;

  RETURN QUERY
  SELECT
    pc.name as class_name,
    pc.start_time,
    pc.end_time,
    pc.location,
    cp.attendance_confirmed,
    cp.absence_confirmed
  FROM student_enrollments se
  JOIN class_participants cp ON cp.student_enrollment_id = se.id
  JOIN programmed_classes pc ON pc.id = cp.class_id
  WHERE se.email = p_student_email
    AND cp.status = 'active'
    AND v_today_day = ANY(pc.days_of_week)
  ORDER BY pc.start_time;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_student_classes_today(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_classes_today(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_student_classes_today(TEXT) TO anon;

-- Test it
SELECT * FROM get_student_classes_today('mark20@gmail.com');
