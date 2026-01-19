-- =====================================================
-- Verificar alumnos con clases a las 17:00 del jueves 8 enero 2026
-- Clubes activos: La Red 21, Hespérides, Wild Padel, Escuela Pádel Fuente Viña
-- =====================================================

WITH clubs_activos AS (
  SELECT id, name FROM clubs WHERE id IN (
    'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21 Galisport
    '7b6f49ae-d496-407b-bca1-f5f1e9370610', -- Hespérides Padel
    'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel Indoor
    'df335578-b68b-4d3f-83e1-d5d7ff16d23c'  -- Escuela Pádel Fuente Viña
  )
),
clases_jueves_17h AS (
  SELECT 
    pc.id as class_id,
    pc.name as class_name,
    pc.start_time,
    pc.days_of_week,
    pc.club_id,
    c.name as club_name
  FROM programmed_classes pc
  JOIN clubs_activos c ON pc.club_id = c.id
  WHERE pc.start_time >= '17:00:00'::time
    AND pc.start_time < '18:00:00'::time
    AND pc.is_active = true
    AND 'jueves' = ANY(pc.days_of_week)  -- jueves como texto
)
SELECT 
  cl.club_name,
  cl.class_name,
  cl.start_time,
  se.full_name as student_name,
  se.email,
  se.phone,
  cp.id as participation_id,
  cp.status as enrollment_status,
  CASE 
    WHEN se.phone IS NOT NULL AND se.phone != '' THEN '✅ Tiene teléfono'
    ELSE '❌ Sin teléfono'
  END as phone_status
FROM clases_jueves_17h cl
JOIN class_participants cp ON cl.class_id = cp.class_id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.status = 'confirmed'
ORDER BY cl.club_name, cl.class_name, se.full_name;
