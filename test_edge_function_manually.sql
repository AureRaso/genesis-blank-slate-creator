-- Test manual de la Edge Function con debugging

-- 1. Verificar que hay notificaciones pendientes para enviar
SELECT
  id,
  student_level,
  status,
  scheduled_for,
  NOW() as hora_actual,
  CASE
    WHEN scheduled_for <= NOW() THEN '✅ LISTO PARA ENVIAR'
    ELSE '⏰ Aún no es hora'
  END as puede_enviarse,
  class_data->>'student_name' as estudiante,
  class_data->>'target_group_name' as grupo
FROM pending_whatsapp_notifications
WHERE status = 'pending'
  AND scheduled_for <= NOW()
ORDER BY scheduled_for ASC;

-- 2. Ver el grupo de WhatsApp destino
SELECT
  wg.id,
  wg.group_name,
  wg.group_chat_id,
  wg.level_target,
  wg.is_active
FROM whatsapp_groups wg
WHERE wg.id = '9a46f48b-22d9-418e-9dcc-3c53feeccb9f';

-- 3. Ejecutar la Edge Function manualmente
SELECT
  net.http_post(
    url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/auto-send-whatsapp-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwMzQzOTEsImV4cCI6MjA0NTYxMDM5MX0.tpKpfTXWMGLmfhK1H3QkPQBqFiKMK3j4sZkwvPeknHo'
    ),
    body := '{}'::jsonb
  ) as request_id;

-- 4. Esperar 5 segundos y verificar si se envió
SELECT pg_sleep(5);

SELECT
  id,
  status,
  sent_at,
  error_message
FROM pending_whatsapp_notifications
WHERE id = 'f6cc35a5-94a7-442c-9b50-939283fcef3d';
