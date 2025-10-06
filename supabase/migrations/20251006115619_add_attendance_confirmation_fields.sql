-- Add attendance confirmation fields to class_participants table
-- This allows players to confirm their attendance for classes on a specific date

ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS attendance_confirmed_for_date DATE,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on today's confirmations
CREATE INDEX IF NOT EXISTS idx_class_participants_attendance_date
ON class_participants(attendance_confirmed_for_date)
WHERE attendance_confirmed_for_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN class_participants.attendance_confirmed_for_date IS 'Date for which the student confirmed attendance';
COMMENT ON COLUMN class_participants.attendance_confirmed_at IS 'Timestamp when the student confirmed attendance';
