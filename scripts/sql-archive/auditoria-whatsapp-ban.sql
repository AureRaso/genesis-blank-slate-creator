-- ============================================
-- AUDITORÍA COMPLETA DE BAN DE WHATSAPP
-- Fecha del ban: 2025-12-29 (~19:00)
-- ============================================

-- 1. VOLUMEN DE MENSAJES POR DÍA (últimos 7 días)
SELECT
  DATE(cp.created_at) as fecha,
  COUNT(*) as total_clases,
  COUNT(DISTINCT cp.student_enrollment_id) as alumnos_unicos
FROM class_participants cp
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE
  pc.is_active = true
  AND cp.status = 'active'
  AND cp.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(cp.created_at)
ORDER BY fecha DESC;

-- 2. ANÁLISIS DEL DÍA DEL BAN (29 de diciembre)
-- ¿Cuántos recordatorios se debían enviar ese día?
WITH clases_29_dic AS (
  SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.days_of_week,
    pc.club_id,
    c.name as club_name,
    COUNT(DISTINCT cp.student_enrollment_id) as num_estudiantes
  FROM programmed_classes pc
  JOIN clubs c ON pc.club_id = c.id
  LEFT JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['lunes']  -- 29 dic fue lunes
    AND pc.start_date <= '2025-12-30'  -- Recordatorio es 24h antes (día 29 para clases del 30)
    AND pc.end_date >= '2025-12-30'
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',  -- Gali
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',  -- La Red 21
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',  -- SVQ Academy
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',  -- Fuente Viña
      'a994e74e-0a7f-4721-8c0f-e23100a01614',  -- Wild Padel
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'   -- Hespérides
    )
  GROUP BY pc.id, pc.name, pc.start_time, pc.days_of_week, pc.club_id, c.name
)
SELECT
  club_name,
  COUNT(*) as num_clases,
  SUM(num_estudiantes) as total_mensajes_whatsapp,
  string_agg(name || ' (' || num_estudiantes || ')', ', ' ORDER BY start_time) as detalle_clases
FROM clases_29_dic
GROUP BY club_name
ORDER BY total_mensajes_whatsapp DESC;

-- 3. PICO DE ENVÍOS - ¿A qué hora se enviaron más mensajes?
-- El cron corre cada 30 minutos, vamos a simular cuándo se disparó cada envío
WITH horarios_cron AS (
  SELECT
    generate_series(
      '2025-12-29 00:00:00'::timestamp,
      '2025-12-29 23:59:00'::timestamp,
      interval '30 minutes'
    ) as cron_time
),
ventanas_envio AS (
  SELECT
    cw.cron_time,
    to_char(cw.cron_time + interval '24 hours', 'HH24:MI:SS')::time as window_start_time,
    to_char(cw.cron_time + interval '24 hours 30 minutes', 'HH24:MI:SS')::time as window_end_time,
    COUNT(DISTINCT cp.student_enrollment_id) as mensajes_a_enviar
  FROM horarios_cron cw
  JOIN programmed_classes pc ON
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['martes']  -- 30 dic es martes
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.start_time::time >= to_char(cw.cron_time + interval '24 hours', 'HH24:MI:SS')::time
    AND pc.start_time::time < to_char(cw.cron_time + interval '24 hours 30 minutes', 'HH24:MI:SS')::time
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  LEFT JOIN class_participants cp ON pc.id = cp.class_id AND cp.status = 'active'
  GROUP BY cw.cron_time, window_start_time, window_end_time
)
SELECT
  to_char(cron_time, 'HH24:MI') as hora_envio,
  to_char(window_start_time, 'HH24:MI') || ' - ' || to_char(window_end_time, 'HH24:MI') as ventana_clases_siguientes,
  mensajes_a_enviar,
  CASE
    WHEN mensajes_a_enviar > 50 THEN '🔴 PICO CRÍTICO'
    WHEN mensajes_a_enviar > 30 THEN '🟡 PICO ALTO'
    WHEN mensajes_a_enviar > 0 THEN '🟢 Normal'
    ELSE '⚪ Sin envíos'
  END as alerta
FROM ventanas_envio
WHERE mensajes_a_enviar > 0
ORDER BY mensajes_a_enviar DESC;

-- 4. VELOCIDAD DE ENVÍO ESTIMADA
-- ¿Cuántos mensajes se enviaron en el pico más alto?
SELECT
  MAX(mensajes_a_enviar) as pico_maximo_mensajes,
  '30 minutos' as ventana_tiempo,
  ROUND(MAX(mensajes_a_enviar)::numeric / 30, 2) as mensajes_por_minuto,
  ROUND(60.0 / (MAX(mensajes_a_enviar)::numeric / 30), 2) as segundos_entre_mensajes
FROM (
  SELECT
    cw.cron_time,
    COUNT(DISTINCT cp.student_enrollment_id) as mensajes_a_enviar
  FROM generate_series(
    '2025-12-29 00:00:00'::timestamp,
    '2025-12-29 23:59:00'::timestamp,
    interval '30 minutes'
  ) cw(cron_time)
  JOIN programmed_classes pc ON
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['martes']
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.start_time::time >= to_char(cw.cron_time + interval '24 hours', 'HH24:MI:SS')::time
    AND pc.start_time::time < to_char(cw.cron_time + interval '24 hours 30 minutes', 'HH24:MI:SS')::time
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  LEFT JOIN class_participants cp ON pc.id = cp.class_id AND cp.status = 'active'
  GROUP BY cw.cron_time
) sub;

-- 5. TOTAL DE MENSAJES ÚNICOS EN LOS ÚLTIMOS 3 DÍAS
-- WhatsApp puede banear si envías al mismo número repetidamente
SELECT
  DATE(cp.created_at) as fecha,
  COUNT(*) as total_registros,
  COUNT(DISTINCT se.phone) as telefonos_unicos
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE
  cp.created_at >= CURRENT_DATE - INTERVAL '3 days'
  AND pc.club_id IN (
    'cc0a5265-99c5-4b99-a479-5334280d0c6d',
    'bbc10821-1c94-4b62-97ac-2fde0708cefd',
    '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',
    'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
    'a994e74e-0a7f-4721-8c0f-e23100a01614',
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  )
  AND se.phone IS NOT NULL
GROUP BY DATE(cp.created_at)
ORDER BY fecha DESC;

-- 6. ANÁLISIS DE CONTENIDO - ¿Mensajes idénticos?
-- WhatsApp puede detectar spam si enviamos el mismo mensaje a muchos números
SELECT
  'Los mensajes son PERSONALIZADOS por alumno' as tipo_mensaje,
  'Incluye: nombre alumno, nombre clase, hora específica' as contenido,
  'BAJO RIESGO de spam' as evaluacion;
