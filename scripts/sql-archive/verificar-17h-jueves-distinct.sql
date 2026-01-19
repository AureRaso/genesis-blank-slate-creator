-- =====================================================
-- Verificar alumnos ÚNICOS con clases jueves 17:00
-- Comparar con los 5 mensajes enviados a las 17:00
-- =====================================================

SELECT DISTINCT
  c.name as club_name,
  pc.name as class_name,
  pc.start_time,
  se.full_name as student_name,
  se.email,
  se.phone
FROM programmed_classes pc
JOIN clubs c ON pc.club_id = c.id
JOIN class_participants cp ON pc.id = cp.class_id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE pc.club_id IN (
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21 Galisport
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', -- Hespérides Padel
  'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel Indoor
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c'  -- Escuela Pádel Fuente Viña
)
AND pc.start_time >= '17:00:00'::time
AND pc.start_time < '18:00:00'::time
AND pc.is_active = true
AND 'jueves' = ANY(pc.days_of_week)
AND cp.status = 'active'
ORDER BY c.name, pc.name, se.full_name;
