import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Club IDs with WhatsApp cancellations enabled via KAPSO
const KAPSO_ENABLED_CLUBS: string[] = [
  '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy - TEST CLUB FOR KAPSO
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', // Hespérides Padel
  'a994e74e-0a7f-4721-8c0f-e23100a01614', // Wild Padel Indoor
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña
  '82608dac-fb10-422a-b158-9097d591fd57', // Finura Padel Academy
  '6fde47fc-c531-4d5e-a54a-025fcd2a4f9c', // X El Padel Lepe
  '4af50537-52b4-4f05-9770-585b4bdd337b', // Club Lora Pádel Indoor
  'b949ebbd-f65b-4e71-b793-e36fed53065e', // Soc Recreativa Huerta Jesús
  'a66741f0-7ac3-4c1b-a7ca-5601959527aa', // KM Pádel
];

interface SendCancellationParams {
  classId: string;
  cancelledDate: string;
  className: string;
  classTime: string;
  reason?: string;
  clubId?: string;
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
      // Solo usar KAPSO para cancelaciones - WHAPI deshabilitado
      const isKapsoEnabled = params.clubId && KAPSO_ENABLED_CLUBS.includes(params.clubId);

      if (!isKapsoEnabled) {
        console.log('⚠️ Club not enabled for KAPSO cancellations, skipping notification');
        return {
          success: true,
          message: 'Cancellation notifications disabled for this club',
          notificationsSent: 0,
          notificationsFailed: 0,
          totalParticipants: 0,
        };
      }

      console.log(`📤 Sending cancellation notifications via Kapso...`, params);

      // Call the Edge Function
      const response = await supabase.functions.invoke<CancellationResponse>(
        'send-class-cancellation-kapso',
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
