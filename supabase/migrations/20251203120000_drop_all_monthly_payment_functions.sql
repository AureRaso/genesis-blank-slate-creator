-- Drop ALL functions that might be referencing monthly_payments with class_id
-- These functions are causing errors when creating class_participants

-- Drop any function that might be auto-generating monthly payments
DROP FUNCTION IF EXISTS auto_generate_monthly_payments() CASCADE;
DROP FUNCTION IF EXISTS generate_monthly_payments() CASCADE;
DROP FUNCTION IF EXISTS create_monthly_payment_on_participant() CASCADE;
DROP FUNCTION IF EXISTS generate_monthly_payment_for_participant() CASCADE;
DROP FUNCTION IF EXISTS handle_new_class_participant() CASCADE;
DROP FUNCTION IF EXISTS handle_class_participant_creation() CASCADE;

-- Drop any triggers that might be on class_participants related to monthly_payments
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tgname, tgrelid::regclass::text as table_name
        FROM pg_trigger
        WHERE tgrelid = 'class_participants'::regclass
          AND tgisinternal = false
    LOOP
        -- Check if trigger might be related to monthly_payments by looking at the function
        IF EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_trigger t ON t.tgfoid = p.oid
            WHERE t.tgname = r.tgname
              AND pg_get_functiondef(p.oid) LIKE '%monthly_payments%'
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s CASCADE', r.tgname, r.table_name);
            RAISE NOTICE 'Dropped trigger % on %', r.tgname, r.table_name;
        END IF;
    END LOOP;
END $$;

-- Comment
COMMENT ON TABLE class_participants IS 'Class participants - monthly payments generation disabled to avoid conflicts';
