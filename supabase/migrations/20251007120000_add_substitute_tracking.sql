-- Add substitute player tracking to class_participants
-- This allows marking players who joined from waitlist as substitutes

ALTER TABLE class_participants
ADD COLUMN IF NOT EXISTS is_substitute BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS joined_from_waitlist_at TIMESTAMP WITH TIME ZONE;

-- Add index for queries filtering by substitute status
CREATE INDEX IF NOT EXISTS idx_class_participants_substitute
ON class_participants(is_substitute)
WHERE is_substitute = true;

-- Add comments for documentation
COMMENT ON COLUMN class_participants.is_substitute IS 'True if player joined as substitute from waitlist';
COMMENT ON COLUMN class_participants.joined_from_waitlist_at IS 'Timestamp when player was accepted from waitlist';
