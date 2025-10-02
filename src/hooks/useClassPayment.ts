import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateClassPaymentParams {
  classId?: string;
  slotId?: string;
  className?: string;
  trainerName?: string;
  monthlyPrice?: number;
  price?: number;
  notes?: string;
}

interface VerifyClassPaymentParams {
  sessionId: string;
}

export const useCreateClassPayment = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateClassPaymentParams) => {
      const { data, error } = await supabase.functions.invoke('create-class-payment', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Payment response:', data);
      if (data?.url) {
        // Redirect to Stripe checkout in the same window
        window.location.href = data.url;
      } else {
        console.error('No URL received from payment function');
      }
    },
    onError: (error) => {
      console.error('Error creating class payment:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useVerifyClassPayment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: VerifyClassPaymentParams) => {
      const { data, error } = await supabase.functions.invoke('verify-class-payment', {
        body: { sessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidar cache para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['student-class-participations'] });
        queryClient.invalidateQueries({ queryKey: ['student-class-reservations'] });

        toast({
          title: "¡Pago exitoso!",
          description: data.type === 'class_subscription'
            ? "Te has suscrito correctamente a la clase. Se renovará automáticamente cada mes."
            : "Te has inscrito correctamente en la clase.",
        });
      }
    },
    onError: (error) => {
      console.error('Error verifying class payment:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el pago.",
        variant: "destructive",
      });
    },
  });
};

export const useCancelSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId }: { subscriptionId: string }) => {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-class-participations'] });

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción se cancelará al final del período actual.",
      });
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la suscripción.",
        variant: "destructive",
      });
    },
  });
};