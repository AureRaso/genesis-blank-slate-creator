-- Crear un cron job para enviar recordatorios diarios a las 9:00 AM
-- Nota: Los horarios en cron.schedule son en UTC
-- 8:00 AM UTC = 9:00 AM Madrid (horario de invierno UTC+1)
-- 7:00 AM UTC = 9:00 AM Madrid (horario de verano UTC+2)

-- Primero eliminamos el job si ya existe (para poder re-ejecutar la migración)
SELECT cron.unschedule('daily-attendance-reminder') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-attendance-reminder'
);

-- Crear el cron job que se ejecuta todos los días a las 8:00 AM UTC (9:00 AM Madrid)
SELECT cron.schedule(
  'daily-attendance-reminder',
  '0 8 * * *', -- Todos los días a las 8:00 AM UTC
  $$
  SELECT net.http_post(
    'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder',
    '{}',
    'application/json'
  );
  $$
);

-- Para verificar que el cron job se creó correctamente, ejecuta:
-- SELECT * FROM cron.job WHERE jobname = 'daily-attendance-reminder';

-- Para ver el historial de ejecuciones:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-attendance-reminder')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Para desactivar el job temporalmente:
-- SELECT cron.unschedule('daily-attendance-reminder');

-- Para cambiar a horario de verano (9:00 AM con UTC+2):
-- SELECT cron.unschedule('daily-attendance-reminder');
-- SELECT cron.schedule('daily-attendance-reminder', '0 7 * * *', $$SELECT net.http_post('https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder', '{}', 'application/json');$$);
