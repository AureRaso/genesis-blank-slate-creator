-- Ver los logs más recientes del cron job
SELECT 
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = 5
  AND start_time > NOW() - INTERVAL '30 minutes'
ORDER BY start_time DESC
LIMIT 15;

-- Ver si el cron está activo
SELECT 
  jobid,
  schedule,
  active,
  jobname
FROM cron.job
WHERE jobname = 'auto-send-whatsapp-notifications';
