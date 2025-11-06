-- Add LOPIVI Protection Delegate fields to clubs table
ALTER TABLE clubs
ADD COLUMN lopivi_delegate_name TEXT,
ADD COLUMN lopivi_delegate_email TEXT,
ADD COLUMN lopivi_delegate_phone TEXT,
ADD COLUMN lopivi_delegate_updated_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the purpose
COMMENT ON COLUMN clubs.lopivi_delegate_name IS 'Nombre del Delegado de Protección LOPIVI del club';
COMMENT ON COLUMN clubs.lopivi_delegate_email IS 'Email de contacto del Delegado de Protección LOPIVI';
COMMENT ON COLUMN clubs.lopivi_delegate_phone IS 'Teléfono de contacto del Delegado de Protección LOPIVI';
COMMENT ON COLUMN clubs.lopivi_delegate_updated_at IS 'Última actualización de la información del Delegado de Protección';
