-- ============================================================================
-- Enable Realtime on class_participants table
-- This allows real-time updates when attendance is confirmed
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable realtime for class_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE class_participants;

-- Verify realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'class_participants';

-- Expected result: Should return one row showing class_participants is published
