-- Drop the problematic function entirely (this will cascade and remove all triggers using it)
DROP FUNCTION IF EXISTS public.trigger_detect_available_spots() CASCADE;

-- Now safely delete the Sergio KL record
DELETE FROM student_enrollments WHERE full_name = 'Sergio KL';