-- Add court_number field to programmed_classes table
ALTER TABLE programmed_classes 
ADD COLUMN court_number integer;

-- Add a check constraint to ensure court_number is between 1 and 7
ALTER TABLE programmed_classes 
ADD CONSTRAINT programmed_classes_court_number_check 
CHECK (court_number >= 1 AND court_number <= 7);