-- Enable scoring and reports for the specific club
-- Club ID: cc0a5265-99c5-4b99-a479-5334280d0c6d

UPDATE clubs
SET enable_scoring_reports = true
WHERE id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d';

-- Log the change
DO $$
DECLARE
  v_club_name TEXT;
BEGIN
  SELECT name INTO v_club_name
  FROM clubs
  WHERE id = 'cc0a5265-99c5-4b99-a479-5334280d0c6d';

  RAISE NOTICE 'Scoring and reports enabled for club: % (ID: cc0a5265-99c5-4b99-a479-5334280d0c6d)', v_club_name;
END $$;
