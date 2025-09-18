-- Optimize database performance for programmed classes
-- Add composite indexes for frequent queries

-- Index for club-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_programmed_classes_club_active 
ON programmed_classes (club_id, is_active) 
WHERE is_active = true;

-- Index for trainer-based queries
CREATE INDEX IF NOT EXISTS idx_programmed_classes_trainer_club 
ON programmed_classes (trainer_profile_id, club_id, is_active)
WHERE is_active = true;

-- Index for participant queries optimization
CREATE INDEX IF NOT EXISTS idx_class_participants_class_status 
ON class_participants (class_id, status)
WHERE status = 'active';

-- Index for efficient duplicate detection
CREATE INDEX IF NOT EXISTS idx_programmed_classes_duplicate_check 
ON programmed_classes (name, club_id, court_number, start_time, start_date)
WHERE is_active = true;

-- Index for waitlist queries
CREATE INDEX IF NOT EXISTS idx_waitlists_class_status 
ON waitlists (class_id, status)
WHERE status = 'waiting';

-- Optimize student enrollment queries
CREATE INDEX IF NOT EXISTS idx_student_enrollments_trainer_club 
ON student_enrollments (trainer_profile_id, club_id, status)
WHERE status = 'active';