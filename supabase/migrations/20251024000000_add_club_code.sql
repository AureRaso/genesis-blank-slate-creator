-- Agregar columna club_code a la tabla clubs
-- Códigos de 3 letras mayúsculas aleatorias (no relacionadas con el nombre)

ALTER TABLE public.clubs
ADD COLUMN club_code VARCHAR(3);

-- Crear constraint para validar formato (solo letras mayúsculas A-Z, exactamente 3 caracteres)
ALTER TABLE public.clubs
ADD CONSTRAINT club_code_format CHECK (
  club_code IS NULL OR
  (club_code ~ '^[A-Z]{3}$')
);

-- Crear constraint UNIQUE para evitar códigos duplicados
ALTER TABLE public.clubs
ADD CONSTRAINT club_code_unique UNIQUE (club_code);

-- Crear índice para búsquedas rápidas por código
CREATE INDEX idx_clubs_club_code ON public.clubs(club_code);

-- Función para generar código aleatorio de 3 letras
CREATE OR REPLACE FUNCTION generate_random_club_code()
RETURNS VARCHAR(3) AS $$
DECLARE
  new_code VARCHAR(3);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar código aleatorio de 3 letras mayúsculas
    new_code := '';
    FOR i IN 1..3 LOOP
      new_code := new_code || CHR(65 + floor(random() * 26)::int);
    END LOOP;

    -- Verificar si el código ya existe
    SELECT EXISTS(SELECT 1 FROM clubs WHERE club_code = new_code) INTO code_exists;

    -- Si no existe, salir del loop
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Asignar códigos aleatorios a todos los clubes existentes
DO $$
DECLARE
  club_record RECORD;
BEGIN
  FOR club_record IN SELECT id FROM clubs WHERE club_code IS NULL LOOP
    UPDATE clubs
    SET club_code = generate_random_club_code()
    WHERE id = club_record.id;
  END LOOP;
END $$;

-- Hacer club_code obligatorio ahora que todos tienen código
ALTER TABLE public.clubs
ALTER COLUMN club_code SET NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN public.clubs.club_code IS 'Código único de 3 letras mayúsculas para que los jugadores se registren en el club';
