-- Obtener participation_ids correctos para los alumnos de La Red 21 Galisport
-- que tienen clases el jueves a las 17:00

SELECT
  cp.id as participation_id,
  se.full_name as student_name,
  se.email,
  se.phone,
  pc.name as class_name,
  pc.start_time
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE pc.club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd' -- La Red 21 Galisport
  AND pc.start_time >= '17:00:00'::time
  AND pc.start_time < '18:00:00'::time
  AND pc.is_active = true
  AND 'jueves' = ANY(pc.days_of_week)
  AND cp.status = 'active'
  AND se.email IN (
    'alasherasfondon24@gmail.com',
    'anna.doubova@gmail.com',
    'dimarsae44@gmail.com',
    'jacobolozano@hotmail.com',
    'jaimecg03@gmail.com',
    'javburmar@gmail.com',
    'anzolamiguel8@gmail.com',
    'bbtmino@us.es',
    '09isidromr@gmail.com',
    'marinamcia97@gmail.com',
    'rociopaulete@gmail.com'
  )
ORDER BY pc.name, se.full_name;
