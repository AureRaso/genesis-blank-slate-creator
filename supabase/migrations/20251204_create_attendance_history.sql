-- Create attendance history table to track all changes to attendance/absence status
CREATE TABLE IF NOT EXISTS attendance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_participant_id UUID NOT NULL REFERENCES class_participants(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,

  -- Action type
  action_type TEXT NOT NULL CHECK (action_type IN ('marked_present', 'marked_absent', 'cancelled_absence', 'confirmed_attendance')),

  -- Who made the change
  changed_by UUID REFERENCES profiles(id),
  changed_by_role TEXT CHECK (changed_by_role IN ('player', 'trainer', 'admin', 'system')),

  -- Previous state
  previous_attendance_confirmed BOOLEAN,
  previous_absence_confirmed BOOLEAN,
  previous_absence_reason TEXT,

  -- New state
  new_attendance_confirmed BOOLEAN,
  new_absence_confirmed BOOLEAN,
  new_absence_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_history_participant
  ON attendance_history(class_participant_id);

CREATE INDEX IF NOT EXISTS idx_attendance_history_date
  ON attendance_history(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_attendance_history_participant_date
  ON attendance_history(class_participant_id, scheduled_date);

-- Add RLS policies
ALTER TABLE attendance_history ENABLE ROW LEVEL SECURITY;

-- Allow admins and trainers to view all history
CREATE POLICY "Admins and trainers can view attendance history"
  ON attendance_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );

-- Allow players to view their own history
CREATE POLICY "Players can view their own attendance history"
  ON attendance_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_participants cp
      JOIN student_enrollments se ON cp.student_enrollment_id = se.id
      JOIN profiles p ON se.student_profile_id = p.id
      WHERE cp.id = attendance_history.class_participant_id
      AND p.id = auth.uid()
    )
  );

-- System can insert history records
CREATE POLICY "System can insert attendance history"
  ON attendance_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a function to automatically log attendance changes
CREATE OR REPLACE FUNCTION log_attendance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if attendance-related fields changed
  IF (OLD.attendance_confirmed_for_date IS DISTINCT FROM NEW.attendance_confirmed_for_date) OR
     (OLD.absence_confirmed IS DISTINCT FROM NEW.absence_confirmed) OR
     (OLD.absence_reason IS DISTINCT FROM NEW.absence_reason) THEN

    -- Determine action type
    DECLARE
      v_action_type TEXT;
      v_changed_by UUID;
      v_changed_by_role TEXT;
    BEGIN
      -- Get the current user
      v_changed_by := auth.uid();

      -- Get user role
      SELECT role INTO v_changed_by_role
      FROM profiles
      WHERE id = v_changed_by;

      -- Determine action type based on changes
      IF NEW.absence_confirmed = true AND (OLD.absence_confirmed IS NULL OR OLD.absence_confirmed = false) THEN
        v_action_type := 'marked_absent';
      ELSIF NEW.absence_confirmed = false AND OLD.absence_confirmed = true THEN
        v_action_type := 'cancelled_absence';
      ELSIF NEW.attendance_confirmed_for_date IS NOT NULL AND OLD.attendance_confirmed_for_date IS NULL THEN
        v_action_type := 'confirmed_attendance';
      ELSIF NEW.attendance_confirmed_for_date IS NULL AND OLD.attendance_confirmed_for_date IS NOT NULL THEN
        v_action_type := 'marked_absent';
      ELSE
        v_action_type := 'marked_present';
      END IF;

      -- Insert history record
      INSERT INTO attendance_history (
        class_participant_id,
        scheduled_date,
        action_type,
        changed_by,
        changed_by_role,
        previous_attendance_confirmed,
        previous_absence_confirmed,
        previous_absence_reason,
        new_attendance_confirmed,
        new_absence_confirmed,
        new_absence_reason
      ) VALUES (
        NEW.id,
        COALESCE(NEW.attendance_confirmed_for_date::DATE, CURRENT_DATE),
        v_action_type,
        v_changed_by,
        v_changed_by_role,
        OLD.attendance_confirmed_for_date IS NOT NULL,
        OLD.absence_confirmed,
        OLD.absence_reason,
        NEW.attendance_confirmed_for_date IS NOT NULL,
        NEW.absence_confirmed,
        NEW.absence_reason
      );
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log changes
DROP TRIGGER IF EXISTS trigger_log_attendance_change ON class_participants;
CREATE TRIGGER trigger_log_attendance_change
  AFTER UPDATE ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION log_attendance_change();

-- Add comment
COMMENT ON TABLE attendance_history IS 'Tracks all changes to attendance and absence status for audit purposes';
