-- Check what classes are programmed for Hespérides Padel
SELECT
  c.name as "Nombre Clase",
  c.start_time as "Hora Inicio",
  c.duration_minutes as "Duración (min)",
  c.court_number as "Pista",
  c.days_of_week as "Días Semana (0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb)",
  c.start_date as "Fecha Inicio",
  c.end_date as "Fecha Fin",
  c.is_active as "Activa",
  cl.name as "Club",
  (SELECT COUNT(*)
   FROM class_participants cp
   WHERE cp.class_id = c.id AND cp.status = 'active') as "Participantes"
FROM programmed_classes c
JOIN clubs cl ON c.club_id = cl.id
WHERE cl.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY c.days_of_week, c.start_time;
