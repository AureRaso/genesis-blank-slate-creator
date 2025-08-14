-- Crear tabla para tokens de inscripción
CREATE TABLE public.enrollment_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  available_spots INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.enrollment_tokens ENABLE ROW LEVEL SECURITY;

-- Crear políticas para tokens de inscripción
CREATE POLICY "Public can view valid enrollment tokens" 
ON public.enrollment_tokens 
FOR SELECT 
USING (is_active = true AND expires_at > now() AND used_count < available_spots);

CREATE POLICY "Trainers can manage their enrollment tokens" 
ON public.enrollment_tokens 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM programmed_classes pc 
  WHERE pc.id = enrollment_tokens.class_id 
  AND pc.created_by = auth.uid()
));

-- Crear función para actualizar timestamps
CREATE TRIGGER update_enrollment_tokens_updated_at
BEFORE UPDATE ON public.enrollment_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para performance
CREATE INDEX idx_enrollment_tokens_token ON public.enrollment_tokens(token);
CREATE INDEX idx_enrollment_tokens_class_id ON public.enrollment_tokens(class_id);
CREATE INDEX idx_enrollment_tokens_expires_at ON public.enrollment_tokens(expires_at);

-- Trigger para notificar plazas disponibles cuando se cancela una participación
CREATE OR REPLACE FUNCTION notify_available_spot()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar si el estado cambió a inactivo
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    -- Llamar a la función de detección de plazas disponibles
    PERFORM net.http_post(
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
      '{"triggered_by": "participant_removal"}',
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para detectar cuando se libera una plaza
CREATE TRIGGER on_participant_status_changed
AFTER UPDATE ON public.class_participants
FOR EACH ROW
EXECUTE FUNCTION notify_available_spot();

-- Trigger para notificar nuevas clases programadas
CREATE OR REPLACE FUNCTION notify_new_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo para clases nuevas que están activas
  IF NEW.is_active = true THEN
    -- Llamar a la función de notificación con delay para permitir que se complete la transacción
    PERFORM net.http_post(
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/notify-waitlist',
      json_build_object(
        'classId', NEW.id::text,
        'availableSpots', NEW.max_participants
      )::text,
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para nuevas clases
CREATE TRIGGER on_new_programmed_class
AFTER INSERT ON public.programmed_classes
FOR EACH ROW
EXECUTE FUNCTION notify_new_class();