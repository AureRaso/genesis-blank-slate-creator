-- Add superadmin role to attendance_history CHECK constraint
-- This allows superadmins to mark attendance/absence and have it logged properly

-- Modify the existing constraint to include superadmin
-- Using ALTER TABLE ... DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT pattern
-- This is safe because it only modifies the allowed values, not the data

ALTER TABLE attendance_history
DROP CONSTRAINT IF EXISTS attendance_history_changed_by_role_check;

ALTER TABLE attendance_history
ADD CONSTRAINT attendance_history_changed_by_role_check
CHECK (changed_by_role IN ('player', 'trainer', 'admin', 'superadmin', 'system'));
