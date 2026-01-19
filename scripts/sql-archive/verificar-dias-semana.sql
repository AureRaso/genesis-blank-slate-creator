-- Verificar qué día de la semana es el 8 de enero de 2026
SELECT 
  '2026-01-08'::date as fecha,
  EXTRACT(DOW FROM '2026-01-08'::date) as dia_semana_dow,
  TO_CHAR('2026-01-08'::date, 'Day') as nombre_dia;

-- Ver los valores reales de days_of_week en las clases activas de los clubes
SELECT DISTINCT 
  c.name as club_name,
  pc.name as class_name,
  pc.start_time,
  pc.days_of_week
FROM programmed_classes pc
JOIN clubs c ON pc.club_id = c.id
WHERE pc.club_id IN (
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21 Galisport
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', -- Hespérides Padel
  'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel Indoor
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c'  -- Escuela Pádel Fuente Viña
)
AND pc.is_active = true
AND pc.start_time >= '17:00:00'::time
AND pc.start_time < '18:00:00'::time
ORDER BY c.name, pc.start_time;
