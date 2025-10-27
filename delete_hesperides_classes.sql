-- Delete all programmed classes and their participants from Hespérides Padel club
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610

-- First, delete all class participants (to avoid foreign key constraints)
DELETE FROM class_participants
WHERE class_id IN (
  SELECT id FROM programmed_classes
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
);

-- Then, delete all programmed classes
DELETE FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Verify deletion
SELECT COUNT(*) as remaining_classes
FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
