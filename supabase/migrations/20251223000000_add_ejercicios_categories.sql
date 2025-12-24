-- =============================================
-- AÑADIR NUEVAS CATEGORÍAS A LA TABLA EJERCICIOS
-- Migración: Actualizar constraint de categorías
-- =============================================

-- Eliminar el constraint existente
ALTER TABLE public.ejercicios DROP CONSTRAINT IF EXISTS ejercicios_categoria_check;

-- Crear el nuevo constraint con todas las categorías
ALTER TABLE public.ejercicios
ADD CONSTRAINT ejercicios_categoria_check
CHECK (categoria IN (
  'Volea',
  'Bandeja',
  'Defensa',
  'Táctica',
  'Calentamiento',
  'Remate',
  'Saque',
  'Globo',
  'Dejada',
  'Víbora',
  'Ataque',
  'Transiciones'
));
