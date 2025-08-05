-- Crear tabla waitlists para gestionar listas de espera
CREATE TABLE public.waitlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'accepted', 'skipped', 'expired')),
  position INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Agregar capacidad máxima a programmed_classes
ALTER TABLE public.programmed_classes ADD COLUMN max_participants INTEGER DEFAULT 8;

-- Crear índices para optimizar consultas
CREATE INDEX idx_waitlists_class_id ON public.waitlists(class_id);
CREATE INDEX idx_waitlists_user_id ON public.waitlists(user_id);
CREATE INDEX idx_waitlists_status ON public.waitlists(status);
CREATE INDEX idx_waitlists_position ON public.waitlists(class_id, position);
CREATE INDEX idx_waitlists_expires_at ON public.waitlists(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para waitlists
CREATE POLICY "Users can view their own waitlist entries" 
ON public.waitlists 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can join waitlists" 
ON public.waitlists 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave their own waitlists" 
ON public.waitlists 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Club admins can manage waitlists for their club classes" 
ON public.waitlists 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM programmed_classes pc
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.id = waitlists.class_id 
    AND c.created_by_profile_id = auth.uid()
  )
);

CREATE POLICY "Trainers can manage waitlists for their classes" 
ON public.waitlists 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM programmed_classes pc
    WHERE pc.id = waitlists.class_id 
    AND pc.created_by = auth.uid()
  )
);

-- Función para actualizar posiciones en lista de espera
CREATE OR REPLACE FUNCTION update_waitlist_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es un INSERT, calcular la nueva posición
  IF TG_OP = 'INSERT' THEN
    NEW.position := COALESCE(
      (SELECT MAX(position) + 1 FROM waitlists WHERE class_id = NEW.class_id),
      1
    );
    RETURN NEW;
  END IF;
  
  -- Si es un DELETE, reordenar posiciones
  IF TG_OP = 'DELETE' THEN
    UPDATE waitlists 
    SET position = position - 1 
    WHERE class_id = OLD.class_id 
    AND position > OLD.position;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para gestión automática de posiciones
CREATE TRIGGER trigger_update_waitlist_positions_insert
  BEFORE INSERT ON waitlists
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_positions();

CREATE TRIGGER trigger_update_waitlist_positions_delete
  AFTER DELETE ON waitlists
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_positions();

-- Función para actualizar updated_at
CREATE TRIGGER update_waitlists_updated_at
  BEFORE UPDATE ON waitlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();