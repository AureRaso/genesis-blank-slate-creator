-- Allow public read access to programmed_classes for waitlist functionality
-- This is needed so users can see class info before logging in when they click a waitlist link

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to programmed classes" ON programmed_classes;

-- Create new policy to allow anyone (authenticated or not) to read programmed_classes
CREATE POLICY "Allow public read access to programmed classes"
ON programmed_classes
FOR SELECT
TO public
USING (true);

-- Note: This only allows reading class information, not modifying it
-- Write operations still require authentication and proper permissions
