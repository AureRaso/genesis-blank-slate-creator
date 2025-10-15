-- Add absence_locked field to prevent players from changing their mind after notification
-- When a trainer notifies WhatsApp group about availability, the absence gets locked

ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS absence_locked BOOLEAN DEFAULT false;

-- Add index for locked absences
CREATE INDEX IF NOT EXISTS idx_class_participants_absence_locked
ON class_participants(absence_locked)
WHERE absence_locked = true;

-- Add comment for documentation
COMMENT ON COLUMN class_participants.absence_locked IS 'True if absence has been notified to WhatsApp group and cannot be changed by player';

-- Update the constraint to include locked absences
-- Players cannot confirm attendance if their absence is locked
ALTER TABLE class_participants
DROP CONSTRAINT IF EXISTS check_attendance_or_absence;

ALTER TABLE class_participants
ADD CONSTRAINT check_attendance_or_absence
CHECK (
  NOT (attendance_confirmed_for_date IS NOT NULL AND absence_confirmed = true)
  AND NOT (attendance_confirmed_for_date IS NOT NULL AND absence_locked = true)
);

COMMENT ON CONSTRAINT check_attendance_or_absence ON class_participants IS 'Ensures player cannot confirm attendance if absence is confirmed or locked';
