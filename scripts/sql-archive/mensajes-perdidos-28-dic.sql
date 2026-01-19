-- ============================================
-- MENSAJES PERDIDOS - DOMINGO 28 DICIEMBRE 2025
-- ============================================
-- Estos mensajes NO se enviaron hoy domingo 28 a las 19:00h
-- porque la cuenta de WhatsApp estaba baneada.
--
-- Son recordatorios para clases del LUNES 29 DICIEMBRE >= 19:30h
-- que deberían haberse enviado 24h antes.
--
-- FILTRO: Solo clases que empiezan a las 19:30 o después (EXCLUYE 19:00)
-- USAR ESTE LISTADO PARA ENVÍO MANUAL cuando tengamos nueva eSIM
-- ============================================

-- RESUMEN: ¿Cuántos mensajes perdimos?
WITH clases_lunes_29 AS (
  SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.club_id,
    c.name as club_name,
    COUNT(DISTINCT cp.student_enrollment_id) as num_estudiantes
  FROM programmed_classes pc
  JOIN clubs c ON pc.club_id = c.id
  JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
    AND cp.absence_confirmed = false
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['lunes']
    AND pc.start_date <= '2025-12-29'
    AND pc.end_date >= '2025-12-29'
    -- FILTRO: Solo clases a partir de las 19:30 (EXCLUYE 19:00)
    AND pc.start_time::time >= '19:30:00'::time
    -- Solo clubs habilitados (los 4 activos)
    AND pc.club_id IN (
      'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c', -- Fuente Viña
      'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Hespérides
    )
  GROUP BY pc.id, pc.name, pc.start_time, pc.club_id, c.name
)
SELECT
  '📊 RESUMEN' as tipo,
  COUNT(*) as clases_afectadas,
  SUM(num_estudiantes) as mensajes_perdidos,
  CONCAT('Se perdieron ', SUM(num_estudiantes), ' mensajes de WhatsApp') as nota
FROM clases_lunes_29;

-- DETALLE COMPLETO: Listado de estudiantes para envío manual
SELECT
  '📋 LISTADO PARA ENVÍO MANUAL' as titulo,
  c.name as club,
  pc.name as clase,
  to_char(pc.start_time, 'HH24:MI') as hora,
  pc.duration_minutes as duracion_min,
  se.full_name as alumno,
  COALESCE(se.phone, p.phone) as telefono,
  se.email,
  CASE
    WHEN COALESCE(se.phone, p.phone) IS NOT NULL THEN '✅ Tiene teléfono'
    ELSE '❌ Sin teléfono (solo email)'
  END as estado_contacto,
  -- Mensaje personalizado para copiar/pegar
  CONCAT(
    '¡Hola ', se.full_name, '! 👋\n\n',
    'Recordatorio: Mañana lunes 29 de diciembre tienes clase de ', pc.name,
    ' a las ', to_char(pc.start_time, 'HH24:MI'), 'h',
    ' (', pc.duration_minutes, ' minutos).\n\n',
    '📍 ', c.name, '\n\n',
    '¿Vendrás? Por favor confirma 👍'
  ) as mensaje_whatsapp
FROM programmed_classes pc
JOIN clubs c ON pc.club_id = c.id
JOIN class_participants cp ON pc.id = cp.class_id
  AND cp.status = 'active'
  AND cp.absence_confirmed = false
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN profiles p ON se.email = p.email
WHERE
  pc.is_active = true
  AND pc.days_of_week @> ARRAY['lunes']
  AND pc.start_date <= '2025-12-29'
  AND pc.end_date >= '2025-12-29'
  -- FILTRO: Solo clases a partir de las 19:00
  AND pc.start_time::time >= '19:00:00'::time
  AND pc.club_id IN (
    'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21
    'df335578-b68b-4d3f-83e1-d5d7ff16d23c', -- Fuente Viña
    'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Hespérides
  )
ORDER BY c.name, pc.start_time, se.full_name;

-- DESGLOSE POR CLUB
WITH clases_lunes_29 AS (
  SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.club_id,
    c.name as club_name,
    COUNT(DISTINCT cp.student_enrollment_id) as num_estudiantes
  FROM programmed_classes pc
  JOIN clubs c ON pc.club_id = c.id
  JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
    AND cp.absence_confirmed = false
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['lunes']
    AND pc.start_date <= '2025-12-29'
    AND pc.end_date >= '2025-12-29'
    -- FILTRO: Solo clases a partir de las 19:30 (EXCLUYE 19:00)
    AND pc.start_time::time >= '19:30:00'::time
    AND pc.club_id IN (
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  GROUP BY pc.id, pc.name, pc.start_time, pc.club_id, c.name
)
SELECT
  '📍 DESGLOSE POR CLUB' as titulo,
  club_name,
  COUNT(*) as num_clases,
  SUM(num_estudiantes) as mensajes_perdidos,
  string_agg(
    name || ' (' || to_char(start_time, 'HH24:MI') || 'h, ' || num_estudiantes || ' alumnos)',
    ', '
    ORDER BY start_time
  ) as detalle_clases
FROM clases_lunes_29
GROUP BY club_name
ORDER BY mensajes_perdidos DESC;

-- ESTADÍSTICAS DE CONTACTO
SELECT
  '📞 ESTADÍSTICAS' as titulo,
  COUNT(*) as total_estudiantes,
  COUNT(COALESCE(se.phone, p.phone)) as con_telefono,
  COUNT(*) - COUNT(COALESCE(se.phone, p.phone)) as sin_telefono,
  ROUND(COUNT(COALESCE(se.phone, p.phone))::numeric / COUNT(*) * 100, 1) as porcentaje_con_telefono
FROM programmed_classes pc
JOIN class_participants cp ON pc.id = cp.class_id
  AND cp.status = 'active'
  AND cp.absence_confirmed = false
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN profiles p ON se.email = p.email
WHERE
  pc.is_active = true
  AND pc.days_of_week @> ARRAY['lunes']
  AND pc.start_date <= '2025-12-29'
  AND pc.end_date >= '2025-12-29'
  -- FILTRO: Solo clases a partir de las 19:00
  AND pc.start_time::time >= '19:00:00'::time
  AND pc.club_id IN (
    'bbc10821-1c94-4b62-97ac-2fde0708cefd',
    'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
    'a994e74e-0a7f-4721-8c0f-e23100a01614',
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  );
