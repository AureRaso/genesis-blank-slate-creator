-- Debug: Ver si se creó la notificación pendiente
SELECT 
  id,
  student_level,
  status,
  scheduled_for,
  sent_at,
  error_message,
  class_data->>'class_name' as clase,
  class_data->>'student_name' as estudiante,
  class_data->>'student_email' as email,
  class_data->>'target_group_name' as grupo_destino,
  created_at,
  NOW() as hora_actual,
  CASE 
    WHEN scheduled_for <= NOW() THEN 'DEBERIA ENVIARSE YA'
    ELSE 'Aún no es hora'
  END as estado_tiempo
FROM pending_whatsapp_notifications
ORDER BY created_at DESC
LIMIT 10;

-- Ver el estado del cron job
SELECT 
  jobid,
  schedule,
  active,
  jobname
FROM cron.job
WHERE jobname = 'auto-send-whatsapp-notifications';

-- Ver los últimos logs de ejecución del cron (si están disponibles)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-send-whatsapp-notifications')
ORDER BY start_time DESC
LIMIT 10;
