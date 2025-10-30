-- Crear tabla para logs de debug del cron
CREATE TABLE IF NOT EXISTS cron_debug_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  function_name text NOT NULL,
  log_level text NOT NULL, -- 'info', 'error', 'debug'
  message text NOT NULL,
  details jsonb,
  request_headers jsonb,
  request_body jsonb
);

-- Índice para consultas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_cron_debug_logs_created_at ON cron_debug_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_debug_logs_function ON cron_debug_logs(function_name, created_at DESC);

-- Permitir que la función anónima escriba en esta tabla
ALTER TABLE cron_debug_logs ENABLE ROW LEVEL SECURITY;

-- Policy para que service_role pueda escribir
CREATE POLICY "Service role can insert logs" ON cron_debug_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy para que admins puedan leer
CREATE POLICY "Admins can read logs" ON cron_debug_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- Función para limpiar logs antiguos (mantener solo últimos 7 días)
CREATE OR REPLACE FUNCTION cleanup_old_cron_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM cron_debug_logs
  WHERE created_at < now() - interval '7 days';
END;
$$;

-- Comentarios
COMMENT ON TABLE cron_debug_logs IS 'Logs de debug para depurar ejecuciones de cron jobs y edge functions';
COMMENT ON COLUMN cron_debug_logs.function_name IS 'Nombre de la función o proceso que generó el log';
COMMENT ON COLUMN cron_debug_logs.log_level IS 'Nivel del log: info, error, debug';
COMMENT ON COLUMN cron_debug_logs.message IS 'Mensaje descriptivo del log';
COMMENT ON COLUMN cron_debug_logs.details IS 'Información adicional en formato JSON';
