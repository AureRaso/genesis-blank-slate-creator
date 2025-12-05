-- Force PostgREST schema reload by sending NOTIFY signal
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verify the column exists and has correct properties
SELECT 
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  pgd.description
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st ON (c.table_schema = st.schemaname AND c.table_name = st.relname)
LEFT JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position)
WHERE c.table_schema = 'public' 
  AND c.table_name = 'class_participants'
  AND c.column_name = 'confirmed_by_trainer';
