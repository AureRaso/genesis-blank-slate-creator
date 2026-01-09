-- Add guardian role to attendance_history CHECK constraint
-- This allows guardians to mark attendance/absence for their children and have it logged properly
-- This migration ONLY modifies the constraint, it does NOT affect any existing data or other functionality

ALTER TABLE attendance_history
DROP CONSTRAINT IF EXISTS attendance_history_changed_by_role_check;

ALTER TABLE attendance_history
ADD CONSTRAINT attendance_history_changed_by_role_check
CHECK (changed_by_role IN ('player', 'trainer', 'admin', 'superadmin', 'guardian', 'system'));
