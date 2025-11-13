-- ====================================
-- CONFIGURACIÓN MEJORADA DEL CRON JOB
-- para recordatorios de asistencia
-- ====================================

-- PASO 1: Eliminar el job existente si existe
SELECT cron.unschedule('send-attendance-reminders-hourly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly'
);

-- PASO 2: Crear el cron job que se ejecuta cada hora
-- IMPORTANTE: Como verify_jwt = true en config.toml, necesitamos pasar un service role key válido
-- O cambiar verify_jwt = false en la configuración de la función

SELECT cron.schedule(
  'send-attendance-reminders-hourly',
  '0 * * * *',  -- Cada hora en el minuto 00
  $$
  SELECT
    net.http_post(
      url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-attendance-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg3MzM3NSwiZXhwIjoyMDY2NDQ5Mzc1fQ.qiJLHJmf40PBK0gYyM0IwJmTrp8xsmZKUzE2MbxCYxw'
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
    database
FROM cron.job
WHERE jobname = 'send-attendance-reminders-hourly';

-- ====================================
-- INFORMACIÓN IMPORTANTE
-- ====================================
--
-- ✅ El cron job está configurado para ejecutarse:
--    - Cada hora en punto (00 minutos)
--    - Ejemplo: 08:00, 09:00, 10:00, etc.
--
-- 📋 La función busca:
--    - Clases que empiezan en 6-7 horas
--    - Participantes sin confirmar asistencia
--    - Les envía email recordatorio
--
-- 📊 Monitoreo:
--    - Logs: Dashboard > Edge Functions > send-attendance-reminders > Logs
--    - Historial de ejecuciones: SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly') ORDER BY start_time DESC LIMIT 10;
--
-- ⚠️ NOTA SOBRE SEGURIDAD:
--    - El service_role_key está hardcodeado aquí
--    - Esto es necesario porque verify_jwt = true en config.toml
--    - Alternativa: Cambiar verify_jwt = false y usar anon key
--
-- 🔧 Para desactivar el cron:
--    SELECT cron.unschedule('send-attendance-reminders-hourly');
