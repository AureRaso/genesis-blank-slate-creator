-- Ver las políticas actuales de programmed_classes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'programmed_classes';