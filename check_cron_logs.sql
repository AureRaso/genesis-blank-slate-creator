-- Ver los últimos logs del cron job
SELECT 
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = 5
ORDER BY start_time DESC
LIMIT 10;
