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
  language?: string; // Language code (es, en, it) - defaults to 'es'
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Message translations by language (fallback to Spanish if not found)
const MESSAGE_TRANSLATIONS: Record<string, {
  absenceTitle: string;
  freeSpotTitle: (slots: number) => string;
  dateLabel: string;
  timeLabel: string;
  trainerLabel: string;
  classLabel: string;
  waitlistCta: string;
  footer: string;
  dateLocale: string;
}> = {
  'es': {
    absenceTitle: '🎾 ¡Plaza en clase disponible!',
    freeSpotTitle: (slots) => `🎾 ¡${slots === 1 ? '1 plaza disponible' : `${slots} plazas disponibles`} en clase!`,
    dateLabel: 'Fecha',
    timeLabel: 'Hora',
    trainerLabel: 'Profesor',
    classLabel: 'Clase',
    waitlistCta: '👉 Apúntate a la lista de espera en el siguiente enlace:',
    footer: 'Las plazas se asignan a criterio del profesor.',
    dateLocale: 'es-ES'
  },
  'en': {
    absenceTitle: '🎾 Spot available in class!',
    freeSpotTitle: (slots) => `🎾 ${slots === 1 ? '1 spot available' : `${slots} spots available`} in class!`,
    dateLabel: 'Date',
    timeLabel: 'Time',
    trainerLabel: 'Coach',
    classLabel: 'Class',
    waitlistCta: '👉 Join the waitlist at the following link:',
    footer: 'Spots are assigned at the coach\'s discretion.',
    dateLocale: 'en-US'
  },
  'it': {
    absenceTitle: '🎾 Posto disponibile nella lezione!',
    freeSpotTitle: (slots) => `🎾 ${slots === 1 ? '1 posto disponibile' : `${slots} posti disponibili`} nella lezione!`,
    dateLabel: 'Data',
    timeLabel: 'Ora',
    trainerLabel: 'Allenatore',
    classLabel: 'Lezione',
    waitlistCta: '👉 Iscriviti alla lista d\'attesa al seguente link:',
    footer: 'I posti vengono assegnati a discrezione dell\'allenatore.',
    dateLocale: 'it-IT'
  }
};

const generateWhatsAppMessage = (params: SendWhatsAppParams): string => {
  const { classDate, classTime, trainerName, waitlistUrl, language } = params;

  // Get translations for the language, fallback to Spanish
  const lang = language || 'es';
  const t = MESSAGE_TRANSLATIONS[lang] || MESSAGE_TRANSLATIONS['es'];

  // Format date nicely using the appropriate locale
  const date = new Date(classDate);
  const formattedDate = new Intl.DateTimeFormat(t.dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Format class time without seconds (HH:MM)
  const formattedClassTime = classTime.substring(0, 5);

  return `${t.absenceTitle}

${t.dateLabel}: ${formattedDate}
${t.timeLabel}: ${formattedClassTime}
${t.trainerLabel}: ${trainerName}

${t.waitlistCta}
${waitlistUrl}

${t.footer}`;
};

const generateFreeSpotMessage = (params: SendWhatsAppParams): string => {
  const { className, classDate, classTime, trainerName, waitlistUrl, availableSlots, language } = params;

  // Get translations for the language, fallback to Spanish
  const lang = language || 'es';
  const t = MESSAGE_TRANSLATIONS[lang] || MESSAGE_TRANSLATIONS['es'];

  // Format date nicely using the appropriate locale
  const date = new Date(classDate);
  const formattedDate = new Intl.DateTimeFormat(t.dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Format class time without seconds (HH:MM)
  const formattedClassTime = classTime.substring(0, 5);

  return `${t.freeSpotTitle(availableSlots)}

📅 ${t.dateLabel}: ${formattedDate}
🕐 ${t.timeLabel}: ${formattedClassTime}
👨‍🏫 ${t.trainerLabel}: ${trainerName}
📍 ${t.classLabel}: ${className}

${t.waitlistCta}
${waitlistUrl}

${t.footer}`;
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
