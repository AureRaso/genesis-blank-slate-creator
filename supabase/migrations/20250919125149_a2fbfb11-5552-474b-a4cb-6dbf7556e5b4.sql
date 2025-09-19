-- Drop specific triggers that are causing timeouts
DROP TRIGGER IF EXISTS trigger_detect_available_spots ON class_participants;
DROP TRIGGER IF EXISTS trigger_detect_available_spots ON student_enrollments;

-- Also remove any other triggers with similar names that might exist
DROP TRIGGER IF EXISTS trigger_detect_available_spots_on_class_participants ON class_participants;
DROP TRIGGER IF EXISTS trigger_detect_available_spots_on_student_enrollments ON student_enrollments;

-- Now safely delete the Sergio KL record
DELETE FROM student_enrollments WHERE full_name = 'Sergio KL';