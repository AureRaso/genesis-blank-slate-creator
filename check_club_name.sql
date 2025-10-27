-- Verificar el nombre exacto del club Hespérides
SELECT id, name, status, address
FROM clubs
WHERE name ILIKE '%hesp%'
ORDER BY name;

-- Ver todos los clubes activos
SELECT id, name, status
FROM clubs
WHERE status = 'active'
ORDER BY name;
