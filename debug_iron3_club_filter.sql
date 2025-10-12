-- Check classes filtered by club_id and trainer
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.club_id,
  pc.trainer_profile_id,
  '81ba7ba9-dbbd-4e58-a34d-dc13c881c3f9' as iron3_club_id,
  pc.club_id = '81ba7ba9-dbbd-4e58-a34d-dc13c881c3f9' as matches_club,
  CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'lunes'
    WHEN 2 THEN 'martes'
    WHEN 3 THEN 'miercoles'
    WHEN 4 THEN 'jueves'
    WHEN 5 THEN 'viernes'
    WHEN 6 THEN 'sabado'
  END as today_day_name,
  pc.days_of_week @> ARRAY[
    CASE EXTRACT(DOW FROM CURRENT_DATE)
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'lunes'
      WHEN 2 THEN 'martes'
      WHEN 3 THEN 'miercoles'
      WHEN 4 THEN 'jueves'
      WHEN 5 THEN 'viernes'
      WHEN 6 THEN 'sabado'
    END
  ]::text[] as is_today,
  CURRENT_DATE::text >= pc.start_date::text as after_start,
  CURRENT_DATE::text <= pc.end_date::text as before_end
FROM programmed_classes pc
WHERE pc.trainer_profile_id = 'bd464755-a2ea-4759-90fb-e562b6f28884'
  AND pc.club_id = '81ba7ba9-dbbd-4e58-a34d-dc13c881c3f9'
  AND pc.is_active = true
  AND pc.days_of_week @> ARRAY[
    CASE EXTRACT(DOW FROM CURRENT_DATE)
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'lunes'
      WHEN 2 THEN 'martes'
      WHEN 3 THEN 'miercoles'
      WHEN 4 THEN 'jueves'
      WHEN 5 THEN 'viernes'
      WHEN 6 THEN 'sabado'
    END
  ]::text[]
  AND CURRENT_DATE::text >= pc.start_date::text
  AND CURRENT_DATE::text <= pc.end_date::text
ORDER BY pc.start_time;
