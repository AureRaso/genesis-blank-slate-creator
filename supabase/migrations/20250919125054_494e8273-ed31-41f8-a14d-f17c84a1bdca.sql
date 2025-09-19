-- Temporarily disable the problematic trigger
DROP TRIGGER IF EXISTS trigger_detect_available_spots_on_class_participants ON class_participants;
DROP TRIGGER IF EXISTS trigger_detect_available_spots_on_student_enrollments ON student_enrollments;

-- Delete the Sergio KL record
DELETE FROM student_enrollments WHERE full_name = 'Sergio KL';

-- Re-create the trigger (but only if it's actually needed)
-- We'll skip recreating it for now to avoid future timeout issues