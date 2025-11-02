-- Script temporal para probar el recordatorio AHORA
-- Este script configura el cron para ejecutarse en el minuto actual + 2

-- Primero eliminamos el job de testing si existe
SELECT cron.unschedule('daily-attendance-reminder-test') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-attendance-reminder-test'
);

-- Calcular el minuto actual + 2 para testing
-- Para testing manual: Reemplaza 'XX' con el minuto deseado
-- Por ejemplo, si son las 13:48, pon '50 13 * * *' para que se ejecute a las 13:50

SELECT cron.schedule(
  'daily-attendance-reminder-test',
  '50 12 * * *', -- CAMBIA ESTO: minuto 50, hora 12 UTC = 13:50 Madrid
  $$
  SELECT net.http_post(
    'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder',
    '{}',
    'application/json'
  );
  $$
);

-- Ver el job creado
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'daily-attendance-reminder-test';

-- Nota: Este job se ejecutará solo cuando llegue el minuto especificado
-- Para eliminarlo después del test:
-- SELECT cron.unschedule('daily-attendance-reminder-test');
