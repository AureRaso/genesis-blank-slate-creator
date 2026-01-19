-- Obtener participation_ids de los alumnos de La Red 21 que no recibieron mensaje
-- Excluyendo a Francisco Javier López Medinilla que sí lo recibió

SELECT DISTINCT
  cp.id as participation_id,
  se.full_name as student_name,
  se.email,
  pc.name as class_name,
  pc.start_time
FROM programmed_classes pc
JOIN clubs c ON pc.club_id = c.id
JOIN class_participants cp ON pc.id = cp.class_id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE pc.club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd' -- La Red 21 Galisport
AND pc.start_time >= '17:00:00'::time
AND pc.start_time < '18:00:00'::time
AND pc.is_active = true
AND 'jueves' = ANY(pc.days_of_week)
AND cp.status = 'active'
AND se.email != 'fran_lm@hotmail.com'  -- Excluir a Francisco Javier que sí recibió
ORDER BY pc.name, se.full_name;
