-- Crear un cron job para revisar plazas disponibles cada 10 minutos
SELECT cron.schedule(
  'check-available-spots',
  '*/10 * * * *', -- Cada 10 minutos
  $$
  SELECT net.http_post(
    'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
    '{"triggered_by": "scheduled_check"}',
    'application/json'
  );
  $$
);