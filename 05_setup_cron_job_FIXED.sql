-- Configurar Cron Job para ejecutar la Edge Function cada minuto
-- IMPORTANTE: Este script requiere la extensión pg_cron
-- Para habilitar pg_cron en Supabase, ve a:
-- Database > Extensions > Busca "pg_cron" > Enable

-- Primero, asegúrate de que la extensión pg_cron esté habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar el job si existe (sin error si no existe)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-send-whatsapp-notifications');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job does not exist, creating new one';
END $$;

-- Crear el cron job para ejecutar cada minuto
SELECT cron.schedule(
  'auto-send-whatsapp-notifications',  -- Nombre del job
  '* * * * *',  -- Ejecutar cada minuto (min hour day month dow)
  $$
  SELECT
    net.http_post(
      url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/auto-send-whatsapp-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verificar que el cron job se creó correctamente
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'auto-send-whatsapp-notifications';

COMMENT ON EXTENSION pg_cron IS 'Programador de trabajos cron para ejecutar la Edge Function de notificaciones WhatsApp automáticas';
