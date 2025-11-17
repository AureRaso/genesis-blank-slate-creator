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

export interface StudentEnrollment {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  club_id: string;
}

export interface MonthlyPaymentWithStudent extends MonthlyPayment {
  student_enrollment: StudentEnrollment;
}

export function useAdminMonthlyPayments() {
  return useQuery({
    queryKey: ['admin-monthly-payments'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get user's profile to get club_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('club_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.club_id) throw new Error('User does not have a club assigned');
      if (profile.role !== 'admin' && profile.role !== 'trainer') {
        throw new Error('User does not have permission to view payments');
      }

      // Get all monthly payments for students in this club
      const { data, error } = await supabase
        .from('monthly_payments')
        .select(`
          *,
          student_enrollment:student_enrollments!inner(
            id,
            full_name,
            email,
            phone,
            club_id
          )
        `)
        .eq('student_enrollment.club_id', profile.club_id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      // Sort by student name in memory (can't do it in the query)
      const sortedData = (data as MonthlyPaymentWithStudent[]).sort((a, b) => {
        // First by year descending
        if (b.year !== a.year) return b.year - a.year;
        // Then by month descending
        if (b.month !== a.month) return b.month - a.month;
        // Finally by student name ascending
        return a.student_enrollment.full_name.localeCompare(b.student_enrollment.full_name);
      });

      return sortedData;
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      status,
      notes,
    }: {
      paymentId: string;
      status: 'pagado' | 'pendiente';
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const updateData: any = {
        status,
        notes,
        updated_at: new Date().toISOString(),
      };

      if (status === 'pagado') {
        updateData.verified_paid_at = new Date().toISOString();
        updateData.verified_by = user.id;
      } else {
        updateData.verified_paid_at = null;
        updateData.verified_by = null;
      }

      const { data, error } = await supabase
        .from('monthly_payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-monthly-payments'] });
      toast.success('Estado de pago actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('Error al actualizar el estado del pago');
    },
  });
}
