
-- Update the profiles table constraint to include 'trainer' role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the updated constraint that includes 'trainer'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'player', 'captain', 'trainer'));
