-- Consultar clases de hoy para mark y mark20
-- Buscar en class_participants para ver sus clases programadas

WITH today_info AS (
  SELECT CURRENT_DATE as today,
         TO_CHAR(CURRENT_DATE, 'Day') as day_name_en,
         CASE EXTRACT(DOW FROM CURRENT_DATE)
           WHEN 0 THEN 'domingo'
           WHEN 1 THEN 'lunes'
           WHEN 2 THEN 'martes'
           WHEN 3 THEN 'miércoles'
           WHEN 4 THEN 'jueves'
           WHEN 5 THEN 'viernes'
           WHEN 6 THEN 'sábado'
         END as day_name_es
)
SELECT
  se.email,
  se.full_name,
  pc.name as class_name,
  pc.start_time,
  pc.end_time,
  pc.days_of_week,
  pc.location,
  cp.status as participation_status,
  cp.attendance_confirmed,
  cp.absence_confirmed,
  ti.day_name_es as today_day
FROM student_enrollments se
JOIN class_participants cp ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON pc.id = cp.class_id
CROSS JOIN today_info ti
WHERE se.email IN ('mark@gmail.com', 'mark20@gmail.com')
  AND cp.status = 'active'
  AND ti.day_name_es = ANY(pc.days_of_week)
ORDER BY se.email, pc.start_time;
