-- Add confirmed_by_trainer field to class_participants table
-- This field tracks whether attendance was confirmed by a trainer/admin vs self-confirmed by student

ALTER TABLE class_participants
ADD COLUMN confirmed_by_trainer BOOLEAN DEFAULT FALSE;

-- Add comment to document the field
COMMENT ON COLUMN class_participants.confirmed_by_trainer IS 'Indicates if attendance was confirmed by a trainer/admin (true) or self-confirmed by the student (false)';
