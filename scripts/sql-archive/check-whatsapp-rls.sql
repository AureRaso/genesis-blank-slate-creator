-- Verificar políticas RLS en whatsapp_groups
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'whatsapp_groups'
ORDER BY policyname;
