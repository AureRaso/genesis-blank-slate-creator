import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MonthlyPayment {
  id: string;
  student_enrollment_id: string;
  month: number;
  year: number;
  price_per_class: number;
  total_classes: number;
  total_amount: number;
  classes_details: Array<{
    class_id: string;
    class_name: string;
    class_date: string;
    start_time: string;
    duration_minutes: number;
  }>;
  status: 'pendiente' | 'en_revision' | 'pagado';
  payment_method?: 'efectivo' | 'bizum' | 'transferencia' | 'tarjeta';
  marked_paid_at?: string;
  verified_paid_at?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyPaymentWithDetails extends MonthlyPayment {
  student_enrollment: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    level: number;
    club_id: string;
    club: {
      id: string;
      name: string;
    };
  };
}

/**
 * Hook to get monthly payments for the current player
 */
export const usePlayerMonthlyPayments = () => {
  return useQuery({
    queryKey: ['player-monthly-payments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Get user's profile to get email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.email) throw new Error("No se encontró email del usuario");

      // Get student enrollment for current user using email
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, club_id, club:clubs(id, name)')
        .eq('email', profile.email)
        .single();

      if (enrollmentError) throw enrollmentError;
      if (!enrollmentData) throw new Error("No se encontró inscripción de estudiante");

      // Get monthly payments - nueva estructura simplificada
      const { data, error } = await supabase
        .from('monthly_payments')
        .select('*')
        .eq('student_enrollment_id', enrollmentData.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      // Agregar información del estudiante y club a cada pago
      const paymentsWithDetails = (data || []).map((payment: any) => ({
        ...payment,
        student_enrollment: {
          id: enrollmentData.id,
          club_id: enrollmentData.club_id,
          club: enrollmentData.club,
        },
      }));

      return paymentsWithDetails as MonthlyPaymentWithDetails[];
    },
  });
};

/**
 * Hook to mark a monthly payment as paid
 */
export const useMarkPaymentAsPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      paymentMethod,
      notes,
    }: {
      paymentId: string;
      paymentMethod: 'efectivo' | 'bizum' | 'transferencia' | 'tarjeta';
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('monthly_payments')
        .update({
          status: 'en_revision',
          payment_method: paymentMethod,
          marked_paid_at: new Date().toISOString(),
          notes,
        })
        .eq('id', paymentId)
        .eq('status', 'pendiente');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-monthly-payments'] });
      toast.success("Pago marcado como pagado", {
        description: "El pago está ahora en revisión. Un profesor lo confirmará pronto.",
      });
    },
    onError: (error) => {
      console.error("Error marking payment as paid:", error);
      toast.error("Error al marcar el pago", {
        description: "No se pudo actualizar el estado del pago. Intenta de nuevo.",
      });
    },
  });
};

/**
 * Hook to get monthly payments summary by month
 */
export const usePlayerPaymentsByMonth = (month: number, year: number) => {
  return useQuery({
    queryKey: ['player-monthly-payments', month, year],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Get user's profile to get email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.email) throw new Error("No se encontró email del usuario");

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (enrollmentError) throw enrollmentError;

      const { data, error } = await supabase
        .from('monthly_payments')
        .select('*')
        .eq('student_enrollment_id', enrollmentData.id)
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;
      return data as MonthlyPayment[];
    },
  });
};
