-- Add group_id column to programmed_classes table
ALTER TABLE programmed_classes 
ADD COLUMN group_id UUID REFERENCES class_groups(id);

-- Add index for better performance
CREATE INDEX idx_programmed_classes_group_id ON programmed_classes(group_id);