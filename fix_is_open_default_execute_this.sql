-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard -> SQL Editor
-- 2. Copia y pega este SQL completo
-- 3. Ejecuta (Run)

-- Fix is_open default value to be false instead of true
-- Classes should be closed by default, only open when explicitly selected

-- Change the default value for existing column
ALTER TABLE programmed_classes
ALTER COLUMN is_open SET DEFAULT false;

-- Add comment to clarify the expected behavior
COMMENT ON COLUMN programmed_classes.is_open IS 'Controls if the class is visible in "Clases Disponibles" for players to book. Default is false (closed class).';

-- DONE! Now the default will be false for new classes
