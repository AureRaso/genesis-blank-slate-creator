-- ============================================
-- PREVIEW DE MENSAJES WHATSAPP - 30 DICIEMBRE 2025
-- ¿Qué mensajes se enviarán hoy domingo para clases del lunes?
-- ============================================

-- CLUBS ACTIVOS AHORA (después de los cambios):
-- ✅ La Red 21 Galisport: bbc10821-1c94-4b62-97ac-2fde0708cefd
-- ✅ Escuela Pádel Fuente Viña: df335578-b68b-4d3f-83e1-d5d7ff16d23c
-- ✅ Wild Padel Indoor: a994e74e-0a7f-4721-8c0f-e23100a01614
-- ✅ Hespérides Padel: 7b6f49ae-d496-407b-bca1-f5f1e9370610
-- ❌ Gali: DESHABILITADO
-- ❌ SVQ Academy: DESHABILITADO

-- 1. RESUMEN TOTAL
WITH clases_lunes AS (
  SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.duration_minutes,
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
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    -- Solo clubs habilitados (4 de 6)
    AND pc.club_id IN (
      'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c', -- Fuente Viña
      'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Hespérides
    )
  GROUP BY pc.id, pc.name, pc.start_time, pc.duration_minutes, pc.club_id, c.name
)
SELECT
  '📊 RESUMEN TOTAL' as titulo,
  COUNT(DISTINCT club_name) as clubs_activos,
  COUNT(*) as total_clases,
  SUM(num_estudiantes) as total_mensajes_whatsapp,
  CONCAT(
    ROUND(SUM(num_estudiantes) * 5.0 / 60, 1),
    ' minutos'
  ) as tiempo_estimado_envio
FROM clases_lunes;

-- 2. DESGLOSE POR CLUB
WITH clases_lunes AS (
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
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.club_id IN (
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  GROUP BY pc.id, pc.name, pc.start_time, pc.club_id, c.name
)
SELECT
  '📍 POR CLUB' as titulo,
  club_name,
  COUNT(*) as num_clases,
  SUM(num_estudiantes) as mensajes_whatsapp,
  CONCAT(
    ROUND(SUM(num_estudiantes) * 5.0 / 60, 1),
    ' min'
  ) as tiempo_envio,
  string_agg(
    name || ' (' || num_estudiantes || ' alumnos)',
    ', '
    ORDER BY start_time
  ) as detalle_clases
FROM clases_lunes
GROUP BY club_name
ORDER BY mensajes_whatsapp DESC;

-- 3. DETALLE POR HORA DE ENVÍO (simulación del cron)
-- El cron corre cada 30 min, enviará mensajes para clases de mañana en esa ventana
WITH horarios_cron AS (
  SELECT
    generate_series(
      '2025-12-29 00:00:00'::timestamp, -- Hoy domingo
      '2025-12-29 23:59:00'::timestamp,
      interval '30 minutes'
    ) as cron_time
),
ventanas_envio AS (
  SELECT
    cw.cron_time,
    to_char(cw.cron_time, 'HH24:MI') as hora_envio_hoy,
    to_char(cw.cron_time + interval '24 hours', 'HH24:MI') as hora_clase_manana,
    to_char(cw.cron_time + interval '24 hours 30 minutes', 'HH24:MI') as hasta_hora,
    COUNT(DISTINCT cp.student_enrollment_id) as mensajes_a_enviar,
    string_agg(
      DISTINCT pc.name || ' (' || c.name || ')',
      ', '
      ORDER BY pc.name || ' (' || c.name || ')'
    ) as clases
  FROM horarios_cron cw
  JOIN programmed_classes pc ON
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['lunes']
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.start_time::time >= to_char(cw.cron_time + interval '24 hours', 'HH24:MI:SS')::time
    AND pc.start_time::time < to_char(cw.cron_time + interval '24 hours 30 minutes', 'HH24:MI:SS')::time
    AND pc.club_id IN (
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  JOIN clubs c ON pc.club_id = c.id
  LEFT JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
    AND cp.absence_confirmed = false
  GROUP BY cw.cron_time, hora_envio_hoy, hora_clase_manana, hasta_hora
)
SELECT
  '⏰ TIMELINE DE ENVÍO' as titulo,
  hora_envio_hoy || ' (hoy dom)' as cuando_se_envia,
  hora_clase_manana || '-' || hasta_hora || ' (lun)' as clases_para,
  mensajes_a_enviar,
  CONCAT(mensajes_a_enviar * 5, 's = ', ROUND(mensajes_a_enviar * 5.0 / 60, 1), ' min') as tiempo,
  CASE
    WHEN mensajes_a_enviar > 20 THEN '🟡 PICO'
    WHEN mensajes_a_enviar > 0 THEN '🟢 Normal'
    ELSE '⚪ Sin envíos'
  END as alerta,
  clases
FROM ventanas_envio
WHERE mensajes_a_enviar > 0
ORDER BY mensajes_a_enviar DESC;

-- 4. LISTA COMPLETA DE ESTUDIANTES (para verificación)
SELECT
  '👥 LISTA COMPLETA' as titulo,
  c.name as club,
  pc.name as clase,
  pc.start_time as hora,
  se.full_name as alumno,
  se.email,
  se.phone,
  CASE
    WHEN se.phone IS NOT NULL THEN '✅ Tiene teléfono'
    ELSE '⚠️ Sin teléfono'
  END as estado_phone
FROM programmed_classes pc
JOIN clubs c ON pc.club_id = c.id
JOIN class_participants cp ON pc.id = cp.class_id
  AND cp.status = 'active'
  AND cp.absence_confirmed = false
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE
  pc.is_active = true
  AND pc.days_of_week @> ARRAY['lunes']
  AND pc.start_date <= '2025-12-30'
  AND pc.end_date >= '2025-12-30'
  AND pc.club_id IN (
    'bbc10821-1c94-4b62-97ac-2fde0708cefd',
    'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
    'a994e74e-0a7f-4721-8c0f-e23100a01614',
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  )
ORDER BY c.name, pc.start_time, se.full_name;

-- 5. COMPARACIÓN: ¿Cuántos mensajes NO se enviarán por clubs deshabilitados?
WITH mensajes_perdidos AS (
  SELECT
    c.name as club_deshabilitado,
    COUNT(DISTINCT cp.student_enrollment_id) as mensajes_que_no_se_enviaran
  FROM programmed_classes pc
  JOIN clubs c ON pc.club_id = c.id
  JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
    AND cp.absence_confirmed = false
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['lunes']
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    -- Clubs DESHABILITADOS
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d', -- Gali
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc'  -- SVQ Academy
    )
  GROUP BY c.name
)
SELECT
  '⚠️ CLUBS DESHABILITADOS' as titulo,
  club_deshabilitado,
  mensajes_que_no_se_enviaran,
  '(recibirán solo email)' as nota
FROM mensajes_perdidos
ORDER BY mensajes_que_no_se_enviaran DESC;
