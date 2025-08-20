-- Identificar vistas con SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security definer%';

-- También revisar si hay vistas en el esquema información
SELECT 
    table_schema,
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND view_definition ILIKE '%security definer%';