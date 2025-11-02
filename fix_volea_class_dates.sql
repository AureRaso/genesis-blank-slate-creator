-- FIX: Corregir fechas de la clase "Volea"
-- Problema: La clase está configurada para domingo pero empieza el sábado

-- Ver la configuración actual de la clase Volea
SELECT
  id,
  name,
  start_date,
  end_date,
  days_of_week,
  start_time,
  end_time,
  club_id,
  is_open
FROM programmed_classes
WHERE name = 'Volea'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- OPCIÓN 1: Cambiar start_date para que empiece el domingo (si la clase es solo domingos)
-- Descomenta si quieres esta opción:
/*
UPDATE programmed_classes
SET start_date = '2025-11-03'
WHERE name = 'Volea'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
*/

-- OPCIÓN 2: Añadir sábado a los días de la semana (si la clase es sábado Y domingo)
-- Descomenta si quieres esta opción:
/*
UPDATE programmed_classes
SET days_of_week = ARRAY['sabado', 'domingo']
WHERE name = 'Volea'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
*/

-- OPCIÓN 3: Cambiar a solo sábado (si la clase es solo sábados)
-- Descomenta si quieres esta opción:
/*
UPDATE programmed_classes
SET days_of_week = ARRAY['sabado']
WHERE name = 'Volea'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
*/

-- Verificar el cambio
SELECT
  id,
  name,
  start_date,
  end_date,
  days_of_week,
  start_time,
  end_time,
  club_id,
  is_open
FROM programmed_classes
WHERE name = 'Volea'
  AND club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
