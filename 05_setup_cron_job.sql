-- Configurar Cron Job para ejecutar la Edge Function cada minuto
-- IMPORTANTE: Este script requiere la extensión pg_cron
-- Para habilitar pg_cron en Supabase, ve a:
-- Database > Extensions > Busca "pg_cron" > Enable

-- NOTA: Para ejecutar este script, necesitas permisos de superusuario
-- En Supabase, ejecuta esto desde el SQL Editor con permisos de admin

-- Primero, asegúrate de que la extensión pg_cron esté habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar el job si ya existe (para poder recrearlo)
SELECT cron.unschedule('auto-send-whatsapp-notifications');

-- Crear el cron job para ejecutar cada minuto
-- Nota: Reemplaza YOUR_PROJECT_REF con tu referencia de proyecto de Supabase
-- Puedes encontrar esto en: Settings > API > Project URL
-- Ejemplo: https://abcdefghijklmnop.supabase.co
SELECT cron.schedule(
  'auto-send-whatsapp-notifications',  -- Nombre del job
  '* * * * *',  -- Ejecutar cada minuto (min hour day month dow)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-whatsapp-notifications',
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

-- INSTRUCCIONES ALTERNATIVAS SI NO TIENES ACCESO A pg_cron:
--
-- 1. Opción A: Usar Supabase Platform (Recomendado)
--    - Ve a Database > Cron Jobs en el dashboard de Supabase
--    - Crea un nuevo job con esta configuración:
--      * Name: auto-send-whatsapp-notifications
--      * Schedule: * * * * * (cada minuto)
--      * Command: (el SELECT net.http_post de arriba)
--
-- 2. Opción B: Usar un servicio externo de Cron
--    - Usa cron-job.org, EasyCron, o similar
--    - Configura para llamar a tu Edge Function cada minuto:
--      URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-whatsapp-notifications
--      Header: Authorization: Bearer YOUR_ANON_KEY
--      Method: POST
--
-- 3. Opción C: Desplegar tu propia función serverless con cron
--    - Vercel Cron Jobs
--    - GitHub Actions (scheduled workflows)
--    - AWS Lambda + CloudWatch Events

COMMENT ON EXTENSION pg_cron IS 'Programador de trabajos cron para ejecutar la Edge Function de notificaciones WhatsApp automáticas';
