-- Investigar la tabla enrollment_tokens

-- 1. Contar registros totales
SELECT COUNT(*) as total_tokens FROM enrollment_tokens;

-- 2. Ver distribución por estado
SELECT
  is_active,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enrollment_tokens), 2) as percentage
FROM enrollment_tokens
GROUP BY is_active
ORDER BY count DESC;

-- 3. Ver tokens expirados vs válidos
SELECT
  CASE
    WHEN expires_at < NOW() THEN 'expired'
    ELSE 'valid'
  END as expiration_status,
  COUNT(*) as count
FROM enrollment_tokens
GROUP BY expiration_status;

-- 4. Ver tokens por clase (top 10 clases con más tokens)
SELECT
  et.class_id,
  pc.name as class_name,
  COUNT(et.id) as token_count
FROM enrollment_tokens et
LEFT JOIN programmed_classes pc ON pc.id = et.class_id
GROUP BY et.class_id, pc.name
ORDER BY token_count DESC
LIMIT 10;

-- 5. Ver cuántos tokens nunca se han usado
SELECT
  COUNT(*) as unused_tokens,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enrollment_tokens), 2) as percentage
FROM enrollment_tokens
WHERE used_count = 0;

-- 6. Ver tokens creados por fecha (últimos 30 días)
SELECT
  DATE(created_at) as creation_date,
  COUNT(*) as tokens_created
FROM enrollment_tokens
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY creation_date DESC;

-- 7. Ver si hay clases que ya no existen pero tienen tokens
SELECT
  COUNT(*) as orphaned_tokens
FROM enrollment_tokens et
LEFT JOIN programmed_classes pc ON pc.id = et.class_id
WHERE pc.id IS NULL;

-- 8. Ver cuántos tokens están activos pero expirados (mal estado)
SELECT
  COUNT(*) as active_but_expired
FROM enrollment_tokens
WHERE is_active = true AND expires_at < NOW();

-- 9. Espacio ocupado por la tabla (aproximado)
SELECT
  pg_size_pretty(pg_total_relation_size('enrollment_tokens')) as table_size;

-- 10. Ver ejemplos de los últimos 5 tokens creados
SELECT
  id,
  token,
  class_id,
  available_spots,
  used_count,
  expires_at,
  is_active,
  created_at
FROM enrollment_tokens
ORDER BY created_at DESC
LIMIT 5;
