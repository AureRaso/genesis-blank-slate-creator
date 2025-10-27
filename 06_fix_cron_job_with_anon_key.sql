-- Arreglar el Cron Job para usar Anon Key en lugar de Service Role Key
-- El problema es que el cron no puede acceder a app.settings.service_role_key

-- Primero, eliminar el job que está fallando
SELECT cron.unschedule('auto-send-whatsapp-notifications');

-- IMPORTANTE: Reemplaza YOUR_ANON_KEY con tu Anon Key de Supabase
-- Puedes encontrarla en: Settings > API > Project API keys > anon public

-- Crear el nuevo cron job con Anon Key hardcodeada
SELECT cron.schedule(
  'auto-send-whatsapp-notifications',
  '* * * * *',  -- Cada minuto
  $$
  SELECT
    net.http_post(
      url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/auto-send-whatsapp-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwMzQzOTEsImV4cCI6MjA0NTYxMDM5MX0.tpKpfTXWMGLmfhK1H3QkPQBqFiKMK3j4sZkwvPeknHo'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verificar que se creó correctamente
SELECT
  jobid,
  schedule,
  active,
  jobname
FROM cron.job
WHERE jobname = 'auto-send-whatsapp-notifications';

-- Nota: Si prefieres no hardcodear la key, puedes usar una de estas alternativas:
-- 1. Crear un vault secret en Supabase y usarlo
-- 2. Usar un servicio externo de cron (cron-job.org)
-- 3. Usar GitHub Actions con scheduled workflows
