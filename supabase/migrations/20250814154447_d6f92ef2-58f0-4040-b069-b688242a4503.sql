-- Habilitar extensiones necesarias para llamadas HTTP
CREATE EXTENSION IF NOT EXISTS http;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verificar que las extensiones estén instaladas
SELECT extname FROM pg_extension WHERE extname IN ('http', 'pg_net');