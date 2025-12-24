-- =============================================
-- AÑADIR FEATURE FLAG PARA BIBLIOTECA DE EJERCICIOS
-- Permite habilitar/deshabilitar la funcionalidad por club
-- =============================================

-- Añadir columna enable_ejercicios a la tabla clubs
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS enable_ejercicios BOOLEAN DEFAULT false;

-- Comentario descriptivo
COMMENT ON COLUMN public.clubs.enable_ejercicios IS 'Feature flag para habilitar la Biblioteca de Ejercicios en el club';
