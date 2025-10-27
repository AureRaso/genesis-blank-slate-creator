-- Arreglar el Cron Job para usar Service Role Key
-- La Edge Function necesita Service Role Key para actualizar la base de datos

-- Primero, eliminar el job actual
SELECT cron.unschedule('auto-send-whatsapp-notifications');

-- IMPORTANTE: Reemplaza YOUR_SERVICE_ROLE_KEY con tu Service Role Key de Supabase
-- Puedes encontrarla en: Settings > API > Project API keys > service_role
--
-- ⚠️ CUIDADO: Esta key tiene permisos de administrador. Solo úsala aquí en el cron job (backend)
-- NUNCA la expongas en el frontend

-- Para obtener tu Service Role Key:
-- 1. Ve a: https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/settings/api
-- 2. Busca "service_role" en "Project API keys"
-- 3. Copia la key completa (es MUY larga)
-- 4. Reemplázala abajo donde dice YOUR_SERVICE_ROLE_KEY

SELECT cron.schedule(
  'auto-send-whatsapp-notifications',
  '* * * * *',  -- Cada minuto
  $$
  SELECT
    net.http_post(
      url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/auto-send-whatsapp-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
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

-- Nota: Una vez que reemplaces YOUR_SERVICE_ROLE_KEY con tu key real, ejecuta este script
