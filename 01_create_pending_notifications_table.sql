-- Crear tabla para notificaciones WhatsApp pendientes
-- Esta tabla gestiona el sistema de envío automático de notificaciones después de 10 minutos

CREATE TABLE IF NOT EXISTS pending_whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referencias a las entidades relacionadas
  class_participant_id UUID REFERENCES class_participants(id) ON DELETE CASCADE,
  class_id UUID REFERENCES programmed_classes(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Información del nivel del estudiante
  student_level INTEGER NOT NULL,

  -- Grupo de WhatsApp al que se debe enviar
  target_whatsapp_group_id UUID REFERENCES whatsapp_groups(id) ON DELETE SET NULL,

  -- Timestamps de control
  scheduled_for TIMESTAMPTZ NOT NULL, -- Cuando debe enviarse (created_at + 10 min)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ, -- Cuando fue enviado
  cancelled_at TIMESTAMPTZ, -- Si fue cancelado

  -- Estado de la notificación
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'manual_sent', 'error')),

  -- Datos de la clase para construir el mensaje
  class_data JSONB NOT NULL,

  -- Mensaje de error si falló
  error_message TEXT
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_pending_notifications_status_scheduled
  ON pending_whatsapp_notifications(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_pending_notifications_class_id
  ON pending_whatsapp_notifications(class_id);

CREATE INDEX IF NOT EXISTS idx_pending_notifications_participant
  ON pending_whatsapp_notifications(class_participant_id);

-- RLS Policies
ALTER TABLE pending_whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver todas las notificaciones
CREATE POLICY "Admins can view all pending notifications"
ON pending_whatsapp_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins pueden insertar notificaciones (aunque normalmente lo hace el trigger)
CREATE POLICY "Admins can insert pending notifications"
ON pending_whatsapp_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins pueden actualizar notificaciones (para cancelar o marcar como manual_sent)
CREATE POLICY "Admins can update pending notifications"
ON pending_whatsapp_notifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Service role puede hacer todo (para la Edge Function)
CREATE POLICY "Service role can do everything"
ON pending_whatsapp_notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE pending_whatsapp_notifications IS 'Gestiona el envío automático de notificaciones WhatsApp 10 minutos después de marcar una ausencia';
COMMENT ON COLUMN pending_whatsapp_notifications.scheduled_for IS 'Momento en el que debe enviarse la notificación (created_at + 10 minutos)';
COMMENT ON COLUMN pending_whatsapp_notifications.status IS 'pending: esperando envío | sent: enviado por cron | manual_sent: enviado manualmente | cancelled: cancelado | error: falló el envío';
COMMENT ON COLUMN pending_whatsapp_notifications.class_data IS 'JSON con información de la clase para construir el mensaje: {class_name, start_time, duration_minutes, class_date}';
