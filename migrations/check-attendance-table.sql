-- Check structure of class_attendance_records table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'class_attendance_records'
ORDER BY ordinal_position;
