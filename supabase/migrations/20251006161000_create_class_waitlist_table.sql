-- Create class_waitlist table for managing waiting list when classes are full
-- Students can join waitlist when spots become available (due to absences)

CREATE TABLE IF NOT EXISTS class_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  student_enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraint: A student can only be in the waitlist once per class/date
  UNIQUE(class_id, class_date, student_enrollment_id)
);

-- Indexes for performance
CREATE INDEX idx_waitlist_class_date ON class_waitlist(class_id, class_date, status);
CREATE INDEX idx_waitlist_student ON class_waitlist(student_enrollment_id, status);
CREATE INDEX idx_waitlist_pending ON class_waitlist(status, requested_at) WHERE status = 'pending';
CREATE INDEX idx_waitlist_class_date_pending ON class_waitlist(class_id, class_date) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE class_waitlist IS 'Manages waiting list for classes when spots become available due to absences or cancellations';
COMMENT ON COLUMN class_waitlist.class_id IS 'Reference to the programmed class';
COMMENT ON COLUMN class_waitlist.class_date IS 'Specific date for this waitlist entry (YYYY-MM-DD)';
COMMENT ON COLUMN class_waitlist.student_enrollment_id IS 'Student who requested to join';
COMMENT ON COLUMN class_waitlist.status IS 'pending: waiting for approval, accepted: student added to class, rejected: request denied, expired: waitlist closed or time passed';
COMMENT ON COLUMN class_waitlist.accepted_by IS 'Trainer or admin who accepted this request';
COMMENT ON COLUMN class_waitlist.rejected_by IS 'Trainer or admin who rejected this request';

-- Enable RLS
ALTER TABLE class_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Players can view their own waitlist entries
CREATE POLICY "Players can view their own waitlist entries" ON class_waitlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE se.id = class_waitlist.student_enrollment_id
        AND p.id = auth.uid()
    )
  );

-- Players can insert their own waitlist entries
CREATE POLICY "Players can join waitlist" ON class_waitlist
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_enrollments se
      JOIN profiles p ON p.email = se.email
      WHERE se.id = student_enrollment_id
        AND p.id = auth.uid()
    )
  );

-- Trainers can view waitlist for their classes
CREATE POLICY "Trainers can view waitlist for their classes" ON class_waitlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_waitlist.class_id
        AND pc.trainer_profile_id = auth.uid()
    )
  );

-- Trainers can manage (update/delete) waitlist for their classes
CREATE POLICY "Trainers can manage waitlist for their classes" ON class_waitlist
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_waitlist.class_id
        AND pc.trainer_profile_id = auth.uid()
    )
  );

-- Club admins can view all waitlist for their club classes
CREATE POLICY "Club admins can view waitlist for club classes" ON class_waitlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      JOIN clubs c ON c.id = pc.club_id
      WHERE pc.id = class_waitlist.class_id
        AND c.created_by_profile_id = auth.uid()
    )
  );

-- Club admins can manage all waitlist for their club classes
CREATE POLICY "Club admins can manage waitlist for club classes" ON class_waitlist
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      JOIN clubs c ON c.id = pc.club_id
      WHERE pc.id = class_waitlist.class_id
        AND c.created_by_profile_id = auth.uid()
    )
  );

-- Super admins can do everything
CREATE POLICY "Admins can manage all waitlists" ON class_waitlist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waitlist_timestamp
  BEFORE UPDATE ON class_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();
