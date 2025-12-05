-- Test query para ver exactamente qué puede acceder la función

-- 1. Ver participaciones
SELECT
  cp.id,
  cp.student_enrollment_id,
  cp.class_id,
  cp.attendance_confirmed_at,
  cp.absence_confirmed
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'mark20@gmail.com'
  AND cp.status = 'active';

-- 2. Ver clases programadas (sin filtro de día)
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.end_time,
  pc.location,
  pc.days_of_week
FROM programmed_classes pc
WHERE pc.id IN (
  SELECT cp.class_id
  FROM class_participants cp
  JOIN student_enrollments se ON se.id = cp.student_enrollment_id
  WHERE se.email = 'mark20@gmail.com'
    AND cp.status = 'active'
);

-- 3. Query completa para hoy (jueves)
WITH today_day AS (
  SELECT CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'lunes'
    WHEN 2 THEN 'martes'
    WHEN 3 THEN 'miércoles'
    WHEN 4 THEN 'jueves'
    WHEN 5 THEN 'viernes'
    WHEN 6 THEN 'sábado'
  END as day_name
)
SELECT
  pc.name as class_name,
  pc.start_time,
  pc.end_time,
  pc.location,
  cp.attendance_confirmed_at,
  cp.absence_confirmed,
  td.day_name as today
FROM student_enrollments se
JOIN class_participants cp ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON pc.id = cp.class_id
CROSS JOIN today_day td
WHERE se.email = 'mark20@gmail.com'
  AND cp.status = 'active'
  AND td.day_name = ANY(pc.days_of_week)
ORDER BY pc.start_time;
