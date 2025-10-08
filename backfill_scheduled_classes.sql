-- Script to generate scheduled_classes from existing programmed_classes that don't have them
-- This is a one-time backfill script for classes created before the automatic generation was added

DO $$
DECLARE
  pc_record RECORD;
  current_date_iter DATE;
  day_of_week_num INTEGER;
  day_map TEXT[] := ARRAY['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  day_name TEXT;
  scheduled_count INTEGER := 0;
BEGIN
  -- Loop through all active programmed_classes
  FOR pc_record IN
    SELECT
      pc.id,
      pc.club_id,
      pc.trainer_profile_id,
      pc.start_date,
      pc.end_date,
      pc.start_time,
      pc.duration_minutes,
      pc.court_number,
      pc.max_participants,
      pc.level_from,
      pc.level_to,
      pc.days_of_week
    FROM programmed_classes pc
    WHERE pc.is_active = true
    -- Only process classes that don't have any scheduled_classes yet
    AND NOT EXISTS (
      SELECT 1
      FROM scheduled_classes sc
      WHERE sc.programmed_class_id = pc.id
    )
  LOOP
    -- Iterate through each day in the date range
    current_date_iter := pc_record.start_date;

    WHILE current_date_iter <= pc_record.end_date LOOP
      -- Get day of week (0 = Sunday, 1 = Monday, etc.)
      day_of_week_num := EXTRACT(DOW FROM current_date_iter);
      day_name := day_map[day_of_week_num + 1];

      -- Check if this day is in the days_of_week array
      IF day_name = ANY(pc_record.days_of_week) THEN
        -- Insert scheduled class
        INSERT INTO scheduled_classes (
          programmed_class_id,
          club_id,
          trainer_profile_id,
          date,
          start_time,
          duration_minutes,
          court_number,
          max_participants,
          level_from,
          level_to,
          status,
          is_active
        ) VALUES (
          pc_record.id,
          pc_record.club_id,
          pc_record.trainer_profile_id,
          current_date_iter,
          pc_record.start_time,
          pc_record.duration_minutes,
          pc_record.court_number,
          pc_record.max_participants,
          pc_record.level_from,
          pc_record.level_to,
          'scheduled',
          true
        );

        scheduled_count := scheduled_count + 1;
      END IF;

      -- Move to next day
      current_date_iter := current_date_iter + INTERVAL '1 day';
    END LOOP;

    RAISE NOTICE 'Processed programmed_class %: generated scheduled classes', pc_record.id;
  END LOOP;

  RAISE NOTICE 'Backfill complete: Generated % scheduled_classes', scheduled_count;
END $$;

-- Verify the results
SELECT
  pc.id as programmed_class_id,
  pc.name,
  c.name as club_name,
  COUNT(sc.id) as scheduled_classes_count
FROM programmed_classes pc
LEFT JOIN clubs c ON c.id = pc.club_id
LEFT JOIN scheduled_classes sc ON sc.programmed_class_id = pc.id
WHERE pc.is_active = true
GROUP BY pc.id, pc.name, c.name
ORDER BY c.name, pc.name;
