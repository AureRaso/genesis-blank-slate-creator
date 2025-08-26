import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateClassPaymentParams {
  classId: string;
  className: string;
  monthlyPrice: number;
}

interface VerifyClassPaymentParams {
  sessionId: string;
}

export const useCreateClassPayment = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, className, monthlyPrice }: CreateClassPaymentParams) => {
      const { data, error } = await supabase.functions.invoke('create-class-payment', {
        body: { classId, className, monthlyPrice }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
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
        toast({
          title: "¡Pago exitoso!",
          description: "Te has inscrito correctamente en la clase.",
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