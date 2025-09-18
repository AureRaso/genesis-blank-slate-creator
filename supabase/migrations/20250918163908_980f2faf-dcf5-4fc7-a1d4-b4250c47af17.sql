-- Verificar y corregir políticas RLS para programmed_classes

-- Primero, vamos a ver si podemos simplificar la consulta para debug
-- Crear una política temporal más permisiva para troubleshooting

-- Política temporal: Los creadores pueden ver sus propias clases
DROP POLICY IF EXISTS "Creators can view their own classes" ON programmed_classes;

CREATE POLICY "Creators can view their own classes" 
ON programmed_classes 
FOR SELECT 
USING (created_by = auth.uid());

-- También asegurar que los administradores de club puedan ver las clases de su club
DROP POLICY IF EXISTS "Club admins can view all club classes" ON programmed_classes;

CREATE POLICY "Club admins can view all club classes" 
ON programmed_classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clubs 
    WHERE clubs.id = programmed_classes.club_id 
    AND clubs.created_by_profile_id = auth.uid()
  )
);