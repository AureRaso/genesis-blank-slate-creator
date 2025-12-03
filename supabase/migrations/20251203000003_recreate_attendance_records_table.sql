-- Create class_attendance_confirmations for managing attendance/absence confirmations
-- Note: class_attendance_confirmations already exists for historical tracking
-- This new table is specifically for managing confirmations per date

-- Create the new table
CREATE TABLE IF NOT EXISTS class_attendance_confirmations (
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
CREATE INDEX idx_attendance_confirmations_participant ON class_attendance_confirmations(class_participant_id);
CREATE INDEX idx_attendance_confirmations_date ON class_attendance_confirmations(scheduled_date);
CREATE INDEX idx_attendance_confirmations_participant_date ON class_attendance_confirmations(class_participant_id, scheduled_date);

-- Enable RLS
ALTER TABLE class_attendance_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own attendance records
CREATE POLICY "Students can view own attendance records"
  ON class_attendance_confirmations FOR SELECT
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
  ON class_attendance_confirmations FOR UPDATE
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Students can insert own attendance
CREATE POLICY "Students can insert own attendance"
  ON class_attendance_confirmations FOR INSERT
  WITH CHECK (
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
  ON class_attendance_confirmations FOR SELECT
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

-- Trainers can insert and update attendance for their classes
CREATE POLICY "Trainers can manage class attendance"
  ON class_attendance_confirmations FOR ALL
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN programmed_classes pc ON pc.id = cp.class_id
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

-- Club admins can manage all attendance
CREATE POLICY "Club admins can manage attendance"
  ON class_attendance_confirmations FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('club_admin', 'admin')
    )
  );

-- Function to automatically create attendance records for upcoming classes
CREATE OR REPLACE FUNCTION ensure_attendance_record(
  p_class_participant_id UUID,
  p_scheduled_date DATE
) RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Try to get existing record
  SELECT id INTO v_record_id
  FROM class_attendance_confirmations
  WHERE class_participant_id = p_class_participant_id
    AND scheduled_date = p_scheduled_date;

  -- If not exists, create it
  IF v_record_id IS NULL THEN
    INSERT INTO class_attendance_confirmations (
      class_participant_id,
      scheduled_date
    ) VALUES (
      p_class_participant_id,
      p_scheduled_date
    )
    RETURNING id INTO v_record_id;
  END IF;

  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE class_attendance_confirmations IS 'Stores attendance/absence records for each specific date of a recurring class. Each class_participant can have multiple records (one per class date).';
COMMENT ON FUNCTION ensure_attendance_record IS 'Helper function to ensure an attendance record exists for a specific date. Creates the record if it does not exist.';
