-- Check detailed column information for confirmed_by_trainer
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_updatable,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'class_participants'
  AND column_name = 'confirmed_by_trainer';

-- Check if there are any column-level privileges
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'class_participants'
  AND column_name = 'confirmed_by_trainer';
