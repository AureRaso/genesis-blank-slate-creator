-- Configuración de Cron Job para recordatorios de asistencia
-- Este job se ejecuta cada hora y envía emails a jugadores sin confirmación

-- 1. Habilitar la extensión pg_cron (solo si no está habilitada)
-- NOTA: En Supabase cloud, pg_cron ya está habilitado, solo ejecuta esto si da error
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Eliminar el job existente si ya existe (para poder recrearlo)
SELECT cron.unschedule('send-attendance-reminders-hourly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly'
);

-- 3. Crear el Cron Job que se ejecuta cada hora
-- Se ejecuta todos los días a cada hora en punto (00 minutos)
SELECT cron.schedule(
  'send-attendance-reminders-hourly',  -- Nombre del job
  '0 * * * *',                          -- Cron expression: cada hora en punto
  $$
  SELECT
    net.http_post(
      url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-attendance-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- 4. Verificar que el job se creó correctamente
SELECT * FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly';

-- NOTAS:
-- - El job se ejecuta cada hora en el minuto 00
-- - Busca clases que empiezan en ~6 horas
-- - Solo envía emails a jugadores SIN confirmación de asistencia/ausencia
-- - Los logs se pueden ver en: Dashboard > Edge Functions > send-attendance-reminders > Logs

-- Para desactivar el cron job (si es necesario):
-- SELECT cron.unschedule('send-attendance-reminders-hourly');

-- Para ver todos los cron jobs activos:
-- SELECT * FROM cron.job;
