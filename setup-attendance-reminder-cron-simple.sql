-- ====================================
-- CONFIGURACIÓN SIMPLE DEL CRON JOB
-- para recordatorios de asistencia
-- ====================================
--
-- IMPORTANTE: Antes de ejecutar este script:
-- 1. Asegúrate de que verify_jwt = false en supabase/config.toml
-- 2. Despliega la función: npx supabase functions deploy send-attendance-reminders
-- 3. Luego ejecuta este script en el SQL Editor de Supabase
--

-- PASO 1: Eliminar el job existente si existe
DO $$
BEGIN
    PERFORM cron.unschedule('send-attendance-reminders-hourly')
    WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly'
    );
END $$;

-- PASO 2: Crear el cron job que se ejecuta cada hora
SELECT cron.schedule(
  'send-attendance-reminders-hourly',
  '0 * * * *',  -- Cada hora en el minuto 00
  $$
  SELECT
    net.http_post(
      url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-attendance-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- PASO 3: Verificar que el job se creó correctamente
SELECT
    jobid,
    jobname,
    schedule,
    active,
    nodename,
    database,
    jobid::text as job_id_for_logs
FROM cron.job
WHERE jobname = 'send-attendance-reminders-hourly';

-- ====================================
-- VERIFICACIÓN RÁPIDA
-- ====================================

-- Ver si el job está activo
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly' AND active = true)
        THEN '✅ Cron job está ACTIVO'
        ELSE '❌ Cron job NO está activo'
    END as status;

-- ====================================
-- COMANDOS ÚTILES
-- ====================================

-- Ver historial de ejecuciones (últimas 10)
-- SELECT
--     runid,
--     status,
--     return_message,
--     start_time,
--     end_time,
--     (end_time - start_time) as duration
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Para desactivar el cron:
-- SELECT cron.unschedule('send-attendance-reminders-hourly');

-- Ver todos los cron jobs activos:
-- SELECT * FROM cron.job WHERE active = true;
