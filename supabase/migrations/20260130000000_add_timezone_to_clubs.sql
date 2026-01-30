-- Add timezone column to clubs table
-- Supports different timezones for international clubs (used in automated reminders)

ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Madrid';

-- Add comment for documentation
COMMENT ON COLUMN clubs.timezone IS 'IANA timezone identifier (Europe/Madrid, America/Mexico_City, etc.) - used for scheduling automated reminders';

-- Update existing clubs to have Europe/Madrid as default (already handled by DEFAULT, but explicit)
UPDATE clubs SET timezone = 'Europe/Madrid' WHERE timezone IS NULL;

-- Example: Update Mexico club timezone (uncomment and set the correct club_id)
-- UPDATE clubs SET timezone = 'America/Mexico_City' WHERE id = 'your-mexico-club-id-here';