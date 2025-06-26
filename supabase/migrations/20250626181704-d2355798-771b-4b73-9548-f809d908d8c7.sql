
-- Agregar campo de precio de inscripción a la tabla leagues
ALTER TABLE public.leagues 
ADD COLUMN registration_price DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.leagues.registration_price IS 'Precio de inscripción por jugador en la liga';
