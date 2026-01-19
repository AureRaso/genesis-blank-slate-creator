-- HOY: Domingo 28 diciembre
-- MAÑANA: Lunes 29 diciembre (se enviarán recordatorios)
-- PARA: Martes 30 diciembre (clases)
-- Clubs habilitados: La Red 21, Fuente Viña, Wild Padel, Hespérides

SELECT
  'Martes 30 Diciembre' as dia_clases,
  COUNT(DISTINCT pc.id) as total_clases,
  COUNT(DISTINCT cp.student_enrollment_id) as total_mensajes_whatsapp,
  CONCAT(COUNT(DISTINCT cp.student_enrollment_id) * 5, ' segundos = ',
         ROUND(COUNT(DISTINCT cp.student_enrollment_id) * 5.0 / 60, 1), ' minutos') as tiempo_total_envio
FROM programmed_classes pc
JOIN class_participants cp ON pc.id = cp.class_id
  AND cp.status = 'active'
  AND cp.absence_confirmed = false
WHERE
  pc.is_active = true
  AND pc.days_of_week @> ARRAY['martes']
  AND pc.start_date <= '2025-12-30'
  AND pc.end_date >= '2025-12-30'
  AND pc.club_id IN (
    'bbc10821-1c94-4b62-97ac-2fde0708cefd', -- La Red 21
    'df335578-b68b-4d3f-83e1-d5d7ff16d23c', -- Fuente Viña
    'a994e74e-0a7f-4721-8c0f-e23100a01614', -- Wild Padel
    '7b6f49ae-d496-407b-bca1-f5f1e9370610'  -- Hespérides
  );
