-- Añadir columna level_target a la tabla whatsapp_groups
-- Esta columna indica a qué nivel de jugador está dirigido cada grupo:
-- 1 = Bronce (principiantes)
-- 2 = Plata (intermedios)
-- 3 = Oro (avanzados)
-- 4 = Menores

ALTER TABLE whatsapp_groups
ADD COLUMN IF NOT EXISTS level_target INTEGER;

-- Añadir constraint para validar valores
ALTER TABLE whatsapp_groups
ADD CONSTRAINT check_level_target
CHECK (level_target IS NULL OR level_target BETWEEN 1 AND 4);

-- Crear índice para búsquedas por nivel
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_level_target
  ON whatsapp_groups(level_target);

-- Añadir comentario explicativo
COMMENT ON COLUMN whatsapp_groups.level_target IS 'Nivel de jugador al que está dirigido este grupo: 1=Bronce, 2=Plata, 3=Oro, 4=Menores. NULL=grupo genérico sin nivel específico';
