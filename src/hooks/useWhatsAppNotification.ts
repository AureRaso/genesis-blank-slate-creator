import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendWhatsAppParams {
  groupChatId: string;
  className: string;
  classDate: string;
  classTime: string;
  trainerName: string;
  waitlistUrl: string;
  availableSlots: number;
  classId: string; // ID de la clase para bloquear ausencias
  notificationType?: 'absence' | 'free_spot'; // Tipo de notificación
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const generateWhatsAppMessage = (params: SendWhatsAppParams): string => {
  const { className, classDate, classTime, trainerName, waitlistUrl } = params;

  // Format date nicely
  const date = new Date(classDate);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Format class time without seconds (HH:MM)
  const formattedClassTime = classTime.substring(0, 5);

  return `🎾 ¡Plaza en clase de recuperación disponible!

Fecha: ${formattedDate}
Hora: ${formattedClassTime}
Profesor: ${trainerName}

👉 Apúntate a la lista de espera en el siguiente enlace:
${waitlistUrl}

Las plazas se asignan a criterio del profesor.`;
};

const generateFreeSpotMessage = (params: SendWhatsAppParams): string => {
  const { className, classDate, classTime, trainerName, waitlistUrl, availableSlots } = params;

  // Format date nicely
  const date = new Date(classDate);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Format class time without seconds (HH:MM)
  const formattedClassTime = classTime.substring(0, 5);

  const slotText = availableSlots === 1 ? '1 plaza disponible' : `${availableSlots} plazas disponibles`;

  return `🎾 ¡${slotText} en clase!

📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedClassTime}
👨‍🏫 Profesor: ${trainerName}
📍 Clase: ${className}

👉 Apúntate a la lista de espera en el siguiente enlace:
${waitlistUrl}

Las plazas se asignan a criterio del profesor.`;
};

export const useSendWhatsAppNotification = () => {
  return useMutation({
    mutationFn: async (params: SendWhatsAppParams) => {
      // Elegir el mensaje según el tipo de notificación
      const message = params.notificationType === 'free_spot'
        ? generateFreeSpotMessage(params)
        : generateWhatsAppMessage(params);

      // Get the current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // SOLO bloquear ausencias si es notificación de ausencia
      if (params.notificationType !== 'free_spot') {
        // Primero bloqueamos las ausencias confirmadas antes de enviar el mensaje
        const { error: lockError } = await supabase
          .from('class_participants')
          .update({ absence_locked: true })
          .eq('class_id', params.classId)
          .eq('absence_confirmed', true);

        if (lockError) {
          console.error('Error locking absences:', lockError);
          throw new Error('Error al bloquear ausencias: ' + lockError.message);
        }

        // Marcar todas las notificaciones pendientes de esta clase como "manual_sent"
        // para evitar que se envíen automáticamente después
        console.log('🔔 Marking pending notifications as manual_sent for class:', params.classId);

        const { error: notificationError } = await supabase
          .from('pending_whatsapp_notifications')
          .update({
            status: 'manual_sent',
            sent_at: new Date().toISOString()
          })
          .eq('class_id', params.classId)
          .eq('status', 'pending');

        if (notificationError) {
          console.warn('⚠️ Warning: Could not update pending notifications:', notificationError);
          // No lanzar error, solo advertir porque el envío principal es más importante
        } else {
          console.log('✅ Pending notifications marked as manual_sent');
        }
      }

      // Call the Edge Function
      const response = await supabase.functions.invoke<WhatsAppResponse>(
        'send-whatsapp-notification',
        {
          body: {
            groupChatId: params.groupChatId,
            message: message,
          },
        }
      );

      console.log('Full response:', response);

      // Check for HTTP errors
      if (response.error) {
        console.error('Error calling Edge Function:', response.error);
        console.error('Error details:', JSON.stringify(response.error, null, 2));

        // Try to extract error message from response data
        const errorMsg = response.data?.error ||
                        (response.error as any)?.message ||
                        'Error al llamar a la función Edge';
        throw new Error(errorMsg);
      }

      const data = response.data;
      console.log('Response data:', data);

      if (!data?.success) {
        console.error('Response error:', data?.error);
        throw new Error(data?.error || 'Error al enviar mensaje de WhatsApp');
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      if (variables.notificationType === 'free_spot') {
        toast.success('✓ Notificación de hueco libre enviada');
      } else {
        toast.success('✓ Mensaje enviado y ausencias bloqueadas');
      }
    },
    onError: (error: any) => {
      console.error('Error sending WhatsApp notification:', error);
      toast.error(error.message || 'Error al enviar notificación de WhatsApp');
    },
  });
};
