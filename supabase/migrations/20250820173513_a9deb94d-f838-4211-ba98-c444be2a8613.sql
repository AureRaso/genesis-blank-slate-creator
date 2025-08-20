-- Buscar todas las vistas en el esquema público
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public';

-- Buscar específicamente objetos que pueden tener security definer
SELECT 
    n.nspname AS schema_name,
    p.proname AS object_name,
    p.prosecdef AS is_security_definer,
    CASE 
        WHEN p.prokind = 'f' THEN 'function'
        WHEN p.prokind = 'p' THEN 'procedure'
        WHEN p.prokind = 'w' THEN 'window function'
        WHEN p.prokind = 'a' THEN 'aggregate'
    END AS object_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.prosecdef = true;

-- También revisar si existe la vista debug_classes que aparece en las tablas
DROP VIEW IF EXISTS debug_classes;