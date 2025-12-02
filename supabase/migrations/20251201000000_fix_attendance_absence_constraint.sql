-- Drop the problematic constraint
ALTER TABLE class_participants
DROP CONSTRAINT IF EXISTS check_attendance_or_absence;

-- Create function to mark absence from WhatsApp
-- This function clears attendance and marks absence in a single operation
CREATE OR REPLACE FUNCTION mark_absence_from_whatsapp(p_participation_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows_affected INTEGER;
  v_result JSONB;
BEGIN
  -- Log before update
  RAISE NOTICE 'Marking absence for participation_id: %', p_participation_id;

  -- Update in a single statement to avoid constraint issues
  UPDATE class_participants
  SET
    absence_confirmed = true,
    absence_confirmed_at = NOW(),
    attendance_confirmed_at = NULL,
    attendance_confirmed_for_date = NULL
  WHERE id = p_participation_id;

  -- Get number of rows affected
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  -- Log after update
  RAISE NOTICE 'Rows affected: %', v_rows_affected;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'rows_affected', v_rows_affected,
    'participation_id', p_participation_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;
