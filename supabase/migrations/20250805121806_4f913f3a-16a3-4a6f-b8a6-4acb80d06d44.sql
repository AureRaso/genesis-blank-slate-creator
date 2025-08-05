-- Habilitar extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear cron job para procesar timeouts de lista de espera cada minuto
SELECT cron.schedule(
  'process-waitlist-timeouts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/process-waitlist-timeout',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMzNzUsImV4cCI6MjA2NjQ0OTM3NX0.At3ieLAkb6bfS46mnPfZ-pzxF7Ghv_kXFmUdiluMjlY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);