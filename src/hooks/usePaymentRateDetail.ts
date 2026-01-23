import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentRate } from "./usePaymentRates";

// Types
export interface RateDetailStudent {
  id: string;
  assignment_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  assignment_start_date: string;
  assignment_status: string;
}

export interface RatePaymentHistory {
  month: string;
  year: number;
  total_amount: number;
  payment_count: number;
  paid_count: number;
  pending_count: number;
  in_review_count: number;
}

export interface RatePriceHistory {
  id: string;
  price: number;
  changed_at: string;
  changed_by: string | null;
}

export interface RateStats {
  total_assigned_students: number;
  active_students: number;
  total_payments_generated: number;
  total_amount_billed: number;
  total_amount_paid: number;
  total_amount_pending: number;
  average_payment_time_days: number | null;
}

// Hook to fetch a single payment rate
export function usePaymentRate(rateId: string | undefined) {
  return useQuery({
    queryKey: ['payment-rate', rateId],
    queryFn: async () => {
      if (!rateId) return null;

      const { data, error } = await supabase
        .from('payment_rates')
        .select('*')
        .eq('id', rateId)
        .single();

      if (error) throw error;
      return data as PaymentRate;
    },
    enabled: !!rateId,
  });
}

// Hook to fetch students assigned to a rate
export function useRateStudents(rateId: string | undefined) {
  return useQuery({
    queryKey: ['payment-rate-students', rateId],
    queryFn: async () => {
      if (!rateId) return [];

      const { data, error } = await supabase
        .from('student_rate_assignments')
        .select(`
          id,
          start_date,
          status,
          student_enrollment:student_enrollments(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('payment_rate_id', rateId)
        .eq('status', 'activa')
        .order('start_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.student_enrollment?.id || '',
        assignment_id: assignment.id,
        full_name: assignment.student_enrollment?.full_name || 'Sin nombre',
        email: assignment.student_enrollment?.email || '',
        phone: assignment.student_enrollment?.phone || null,
        assignment_start_date: assignment.start_date,
        assignment_status: assignment.status,
      })) as RateDetailStudent[];
    },
    enabled: !!rateId,
  });
}

// Hook to fetch payment statistics for a rate
export function useRateStats(rateId: string | undefined) {
  return useQuery({
    queryKey: ['payment-rate-stats', rateId],
    queryFn: async () => {
      if (!rateId) return null;

      // Get all assignments for this rate
      const { data: assignments, error: assignmentsError } = await supabase
        .from('student_rate_assignments')
        .select('id, status')
        .eq('payment_rate_id', rateId);

      if (assignmentsError) throw assignmentsError;

      // Get all payments for this rate
      const { data: payments, error: paymentsError } = await supabase
        .from('student_payments')
        .select('id, amount, status, issue_date, admin_verified_at')
        .eq('payment_rate_id', rateId);

      if (paymentsError) throw paymentsError;

      const totalAssigned = assignments?.length || 0;
      const activeStudents = assignments?.filter(a => a.status === 'activa').length || 0;
      const totalPayments = payments?.length || 0;
      const totalBilled = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const paidPayments = payments?.filter(p => p.status === 'pagado') || [];
      const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = payments?.filter(p => p.status === 'pendiente' || p.status === 'en_revision') || [];
      const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate average payment time for paid payments
      let averagePaymentDays: number | null = null;
      if (paidPayments.length > 0) {
        const paymentTimes = paidPayments
          .filter(p => p.admin_verified_at && p.issue_date)
          .map(p => {
            const issueDate = new Date(p.issue_date);
            const verifiedDate = new Date(p.admin_verified_at!);
            return Math.ceil((verifiedDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          });

        if (paymentTimes.length > 0) {
          averagePaymentDays = Math.round(paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length);
        }
      }

      return {
        total_assigned_students: totalAssigned,
        active_students: activeStudents,
        total_payments_generated: totalPayments,
        total_amount_billed: totalBilled,
        total_amount_paid: totalPaid,
        total_amount_pending: totalPending,
        average_payment_time_days: averagePaymentDays,
      } as RateStats;
    },
    enabled: !!rateId,
  });
}

// Hook to fetch payment history by month for a rate
export function useRatePaymentHistory(rateId: string | undefined) {
  return useQuery({
    queryKey: ['payment-rate-history', rateId],
    queryFn: async () => {
      if (!rateId) return [];

      const { data: payments, error } = await supabase
        .from('student_payments')
        .select('amount, status, period_start, issue_date')
        .eq('payment_rate_id', rateId)
        .order('period_start', { ascending: false });

      if (error) throw error;

      // Group by month/year
      const monthlyData: Record<string, RatePaymentHistory> = {};

      (payments || []).forEach(payment => {
        const date = payment.period_start || payment.issue_date;
        if (!date) return;

        const d = new Date(date);
        const month = d.toLocaleString('es-ES', { month: 'short' });
        const year = d.getFullYear();
        const key = `${year}-${d.getMonth().toString().padStart(2, '0')}`;

        if (!monthlyData[key]) {
          monthlyData[key] = {
            month: month.charAt(0).toUpperCase() + month.slice(1),
            year,
            total_amount: 0,
            payment_count: 0,
            paid_count: 0,
            pending_count: 0,
            in_review_count: 0,
          };
        }

        monthlyData[key].total_amount += payment.amount;
        monthlyData[key].payment_count += 1;

        if (payment.status === 'pagado') {
          monthlyData[key].paid_count += 1;
        } else if (payment.status === 'pendiente') {
          monthlyData[key].pending_count += 1;
        } else if (payment.status === 'en_revision') {
          monthlyData[key].in_review_count += 1;
        }
      });

      // Convert to array and sort by date (most recent first)
      return Object.entries(monthlyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 12) // Last 12 months
        .map(([, data]) => data);
    },
    enabled: !!rateId,
  });
}

// Hook to fetch all historical assignments (including inactive) for a rate
export function useRateAllAssignments(rateId: string | undefined) {
  return useQuery({
    queryKey: ['payment-rate-all-assignments', rateId],
    queryFn: async () => {
      if (!rateId) return [];

      const { data, error } = await supabase
        .from('student_rate_assignments')
        .select(`
          id,
          start_date,
          end_date,
          status,
          created_at,
          student_enrollment:student_enrollments(
            id,
            full_name,
            email
          )
        `)
        .eq('payment_rate_id', rateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!rateId,
  });
}

// Hook to remove a rate assignment (change status to 'finalizada')
export function useRemoveRateAssignment(rateId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('student_rate_assignments')
        .update({
          status: 'finalizada',
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payment-rate-students', rateId] });
      queryClient.invalidateQueries({ queryKey: ['payment-rate-stats', rateId] });
      queryClient.invalidateQueries({ queryKey: ['payment-rate-all-assignments', rateId] });
    },
    onError: (error) => {
      console.error('Error removing rate assignment:', error);
      toast.error('Error al quitar la tarifa');
    },
  });
}
