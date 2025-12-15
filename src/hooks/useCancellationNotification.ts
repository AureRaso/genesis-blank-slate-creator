import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendCancellationParams {
  classId: string;
  cancelledDate: string;
  className: string;
  classTime: string;
  reason?: string;
}

interface CancellationResponse {
  success: boolean;
  message?: string;
  notificationsSent?: number;
  notificationsFailed?: number;
  totalParticipants?: number;
  error?: string;
}

export const useSendCancellationNotification = () => {
  return useMutation({
    mutationFn: async (params: SendCancellationParams): Promise<CancellationResponse> => {
      console.log('📤 Sending cancellation notifications...', params);

      // Call the Edge Function
      const response = await supabase.functions.invoke<CancellationResponse>(
        'send-class-cancellation-whatsapp',
        {
          body: {
            classId: params.classId,
            cancelledDate: params.cancelledDate,
            className: params.className,
            classTime: params.classTime,
            reason: params.reason,
          },
        }
      );

      console.log('Response:', response);

      if (response.error) {
        console.error('Error calling Edge Function:', response.error);
        throw new Error(response.data?.error || 'Error al enviar notificaciones');
      }

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.error || 'Error al enviar notificaciones de cancelación');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.notificationsSent && data.notificationsSent > 0) {
        toast.success(`✓ ${data.notificationsSent} notificación${data.notificationsSent > 1 ? 'es' : ''} enviada${data.notificationsSent > 1 ? 's' : ''}`);
      } else if (data.totalParticipants === 0) {
        toast.info('No hay alumnos para notificar');
      } else {
        toast.warning('No se pudieron enviar las notificaciones');
      }
    },
    onError: (error: any) => {
      console.error('Error sending cancellation notifications:', error);
      toast.error(error.message || 'Error al enviar notificaciones');
    },
  });
};
