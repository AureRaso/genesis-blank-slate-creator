-- Eliminar el cron job anterior y crear uno nuevo con la función correcta
SELECT cron.unschedule('check-available-spots');

-- Crear un nuevo cron job con la función HTTP correcta
SELECT cron.schedule(
  'check-available-spots-v2',
  '*/10 * * * *', -- Cada 10 minutos
  $$
  SELECT http_post(
    'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
    '{"triggered_by": "scheduled_check"}',
    'application/json'
  );
  $$
);