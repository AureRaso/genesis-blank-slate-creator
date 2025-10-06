-- Add absence tracking fields to class_participants
-- This allows players to mark they won't attend with an optional reason

ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS absence_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS absence_reason TEXT,
ADD COLUMN IF NOT EXISTS absence_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for queries filtering by absence
CREATE INDEX IF NOT EXISTS idx_class_participants_absence
ON class_participants(absence_confirmed)
WHERE absence_confirmed = true;

-- Add comments for documentation
COMMENT ON COLUMN class_participants.absence_confirmed IS 'True if player confirmed they will NOT attend';
COMMENT ON COLUMN class_participants.absence_reason IS 'Optional reason why player cannot attend';
COMMENT ON COLUMN class_participants.absence_confirmed_at IS 'Timestamp when player confirmed absence';

-- Add constraint: cannot have both attendance and absence confirmed
ALTER TABLE class_participants
ADD CONSTRAINT check_attendance_or_absence
CHECK (
  NOT (attendance_confirmed_for_date IS NOT NULL AND absence_confirmed = true)
);

COMMENT ON CONSTRAINT check_attendance_or_absence ON class_participants IS 'Ensures player cannot confirm both attendance and absence';
