-- Ghost profiles: allow academies to pre-register students who haven't signed up yet.
-- When a student registers and their phone matches a ghost enrollment in the same club,
-- they can confirm and link to the existing enrollment (inheriting class assignments, etc.)

-- Add ghost profile fields to student_enrollments
ALTER TABLE student_enrollments
ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghost_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ghost_matched_at TIMESTAMPTZ;

-- Index for fast phone-based lookups of ghost profiles within a club
CREATE INDEX IF NOT EXISTS idx_student_enrollments_ghost_phone
ON student_enrollments(phone, club_id)
WHERE is_ghost = true;

-- Comments for documentation
COMMENT ON COLUMN student_enrollments.is_ghost IS 'True when enrollment was pre-created by admin without a real user account';
COMMENT ON COLUMN student_enrollments.ghost_created_at IS 'Timestamp when the ghost enrollment was created';
COMMENT ON COLUMN student_enrollments.ghost_matched_at IS 'Timestamp when a real user matched and claimed this ghost enrollment';