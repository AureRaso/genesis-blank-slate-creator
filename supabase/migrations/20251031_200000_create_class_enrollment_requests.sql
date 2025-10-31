-- Create class_enrollment_requests table for managing enrollment requests to programmed classes
-- Students can request to join a class when it's open for enrollment

CREATE TABLE IF NOT EXISTS class_enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programmed_class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraint: A student can only have one active request per class
  UNIQUE(programmed_class_id, student_profile_id)
);

-- Indexes for performance
CREATE INDEX idx_enrollment_requests_class ON class_enrollment_requests(programmed_class_id, status);
CREATE INDEX idx_enrollment_requests_student ON class_enrollment_requests(student_profile_id, status);
CREATE INDEX idx_enrollment_requests_pending ON class_enrollment_requests(status, requested_at) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE class_enrollment_requests IS 'Manages enrollment requests for programmed classes';
COMMENT ON COLUMN class_enrollment_requests.programmed_class_id IS 'Reference to the programmed class';
COMMENT ON COLUMN class_enrollment_requests.student_profile_id IS 'Student profile who requested enrollment';
COMMENT ON COLUMN class_enrollment_requests.status IS 'pending: waiting for approval, accepted: student enrolled, rejected: request denied, cancelled: student cancelled request';
COMMENT ON COLUMN class_enrollment_requests.processed_by IS 'Trainer or admin who processed this request';
COMMENT ON COLUMN class_enrollment_requests.rejection_reason IS 'Reason for rejection if status is rejected';

-- Enable RLS
ALTER TABLE class_enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Players can view their own requests
CREATE POLICY "Players can view their own enrollment requests" ON class_enrollment_requests
  FOR SELECT USING (
    student_profile_id = auth.uid()
  );

-- Players can create their own requests
CREATE POLICY "Players can create enrollment requests" ON class_enrollment_requests
  FOR INSERT WITH CHECK (
    student_profile_id = auth.uid()
  );

-- Players can cancel their own pending requests
CREATE POLICY "Players can cancel their pending requests" ON class_enrollment_requests
  FOR UPDATE USING (
    student_profile_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- Trainers can view requests for their classes
CREATE POLICY "Trainers can view requests for their classes" ON class_enrollment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.trainer_profile_id = auth.uid()
    )
  );

-- Trainers can manage requests for their classes
CREATE POLICY "Trainers can manage requests for their classes" ON class_enrollment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.trainer_profile_id = auth.uid()
    )
  );

-- Admins can view all requests for their club classes
CREATE POLICY "Admins can view requests for club classes" ON class_enrollment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('admin', 'trainer')
    )
  );

-- Admins can manage all requests for their club classes
CREATE POLICY "Admins can manage requests for club classes" ON class_enrollment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('admin', 'trainer')
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enrollment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_requests_timestamp
  BEFORE UPDATE ON class_enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_requests_updated_at();
