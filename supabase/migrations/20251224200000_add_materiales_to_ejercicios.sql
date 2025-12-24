-- Añadir campo materiales a la tabla ejercicios
ALTER TABLE ejercicios
ADD COLUMN IF NOT EXISTS materiales TEXT[] DEFAULT '{}';

-- Comentario para documentación
COMMENT ON COLUMN ejercicios.materiales IS 'Lista de materiales necesarios para el ejercicio';
