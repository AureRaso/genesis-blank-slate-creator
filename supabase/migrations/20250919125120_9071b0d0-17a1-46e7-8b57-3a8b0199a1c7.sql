-- First, find and drop ALL triggers that use the problematic function
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    -- Drop all triggers that use trigger_detect_available_spots function
    FOR trigger_record IN 
        SELECT schemaname, tablename, triggername 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE p.proname = 'trigger_detect_available_spots'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                      trigger_record.triggername, 
                      trigger_record.schemaname, 
                      trigger_record.tablename);
    END LOOP;
END $$;

-- Now safely delete the record
DELETE FROM student_enrollments WHERE full_name = 'Sergio KL';