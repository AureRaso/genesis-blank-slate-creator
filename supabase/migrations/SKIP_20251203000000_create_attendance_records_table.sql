-- Create table for date-specific attendance tracking
CREATE TABLE IF NOT EXISTS class_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_participant_id UUID NOT NULL REFERENCES class_participants(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  attendance_confirmed BOOLEAN DEFAULT FALSE,
  attendance_confirmed_at TIMESTAMPTZ,
  absence_confirmed BOOLEAN DEFAULT FALSE,
  absence_reason TEXT,
  absence_confirmed_at TIMESTAMPTZ,
  absence_locked BOOLEAN DEFAULT FALSE,
  confirmed_by_trainer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per participant per date
  UNIQUE(class_participant_id, scheduled_date)
);

-- Add indexes for common queries
CREATE INDEX idx_attendance_records_participant ON class_attendance_records(class_participant_id);
CREATE INDEX idx_attendance_records_date ON class_attendance_records(scheduled_date);
CREATE INDEX idx_attendance_records_participant_date ON class_attendance_records(class_participant_id, scheduled_date);

-- Enable RLS
ALTER TABLE class_attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own attendance records
CREATE POLICY "Students can view own attendance records"
  ON class_attendance_records FOR SELECT
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Students can update their own attendance (mark absences)
CREATE POLICY "Students can update own attendance"
  ON class_attendance_records FOR UPDATE
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Trainers can view attendance for their classes
CREATE POLICY "Trainers can view class attendance"
  ON class_attendance_records FOR SELECT
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE pc.trainer_id = auth.uid()
    )
  );

-- Trainers can insert and update attendance for their classes
CREATE POLICY "Trainers can manage class attendance"
  ON class_attendance_records FOR ALL
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE pc.trainer_id = auth.uid()
    )
  );

-- Club admins can manage all attendance
CREATE POLICY "Club admins can manage attendance"
  ON class_attendance_records FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.user_type IN ('club_admin', 'admin')
    )
  );

-- Function to automatically create attendance records for upcoming classes
CREATE OR REPLACE FUNCTION create_attendance_records_for_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for future automation
  -- Could automatically create records for the next N weeks
  -- when a participant is added to a class
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the table
COMMENT ON TABLE class_attendance_records IS 'Stores attendance/absence records for each specific date of a recurring class. Each class_participant can have multiple records (one per class date).';
