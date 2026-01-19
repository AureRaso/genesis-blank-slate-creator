import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PaymentRate } from "./usePaymentRates";

// Types
export interface StudentPayment {
  id: string;
  club_id: string;
  student_enrollment_id: string;
  payment_rate_id: string | null;
  rate_assignment_id: string | null;
  concept: string;
  description: string | null;
  amount: number;
  classes_count: number | null;
  period_start: string | null;
  period_end: string | null;
  issue_date: string;
  due_date: string;
  status: 'pendiente' | 'en_revision' | 'pagado';
  payment_method: 'efectivo' | 'tarjeta' | 'bizum' | null;
  is_extra_payment: boolean;
  student_marked_paid_at: string | null;
  admin_verified_at: string | null;
  reminder_sent_at: string | null;
  student_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  payment_rate?: PaymentRate | null;
  student_enrollment?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export interface CreateExtraPaymentInput {
  student_enrollment_id: string;
  concept: string;
  amount: number;
  description?: string;
  due_date?: string;
}

// ===== ADMIN HOOKS =====

// Fetch all payments for a club (admin view)
export function useAdminStudentPayments(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['student-payments', 'admin', targetClubId],
    queryFn: async () => {
      if (!targetClubId) return [];

      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          payment_rate:payment_rates(*),
          student_enrollment:student_enrollments(id, full_name, email, phone)
        `)
        .eq('club_id', targetClubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudentPayment[];
    },
    enabled: !!targetClubId,
  });
}

// Create an extra payment (admin)
export function useCreateExtraPayment() {
  const queryClient = useQueryClient();
  const { effectiveClubId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateExtraPaymentInput) => {
      if (!effectiveClubId) throw new Error('No club selected');

      const dueDate = input.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('student_payments')
        .insert({
          club_id: effectiveClubId,
          student_enrollment_id: input.student_enrollment_id,
          concept: input.concept,
          description: input.description || null,
          amount: input.amount,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: 'pendiente',
          is_extra_payment: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      toast.success('Pago extra creado correctamente');
    },
    onError: (error: Error) => {
      console.error('Error creating extra payment:', error);
      toast.error('Error al crear el pago extra');
    },
  });
}

// Verify payment (admin marks as paid or rejects)
export function useVerifyStudentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      status,
      adminNotes,
    }: {
      paymentId: string;
      status: 'pagado' | 'pendiente';
      adminNotes?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status,
        admin_notes: adminNotes || null,
      };

      if (status === 'pagado') {
        updates.admin_verified_at = new Date().toISOString();
      } else {
        // Rejecting - reset to pending
        updates.admin_verified_at = null;
        updates.student_marked_paid_at = null;
        updates.payment_method = null;
      }

      const { data, error } = await supabase
        .from('student_payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      toast.success(
        data.status === 'pagado' ? 'Pago verificado correctamente' : 'Pago rechazado'
      );
    },
    onError: (error: Error) => {
      console.error('Error verifying payment:', error);
      toast.error('Error al verificar el pago');
    },
  });
}

// Delete payment (admin)
export function useDeleteStudentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('student_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      toast.success('Pago eliminado');
    },
    onError: (error: Error) => {
      console.error('Error deleting payment:', error);
      toast.error('Error al eliminar el pago');
    },
  });
}

// ===== STUDENT/PLAYER HOOKS =====

// Fetch payments for current student
export function useMyPayments() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-payments', 'my', profile?.id],
    queryFn: async () => {
      if (!profile?.email) return [];

      // First get student enrollment for this profile's email
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('email', profile.email);

      if (enrollmentError) throw enrollmentError;
      if (!enrollments || enrollments.length === 0) return [];

      const enrollmentIds = enrollments.map(e => e.id);

      // Then get payments for those enrollments
      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          payment_rate:payment_rates(name, periodicity)
        `)
        .in('student_enrollment_id', enrollmentIds)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as StudentPayment[];
    },
    enabled: !!profile?.email,
  });
}

// Mark payment as paid (student)
export function useMarkPaymentAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      paymentMethod,
      studentNotes,
    }: {
      paymentId: string;
      paymentMethod: 'efectivo' | 'tarjeta' | 'bizum';
      studentNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('student_payments')
        .update({
          status: 'en_revision',
          payment_method: paymentMethod,
          student_marked_paid_at: new Date().toISOString(),
          student_notes: studentNotes || null,
        })
        .eq('id', paymentId)
        .eq('status', 'pendiente') // Can only mark pending payments
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      toast.success('Pago marcado como realizado. Pendiente de verificación.');
    },
    onError: (error: Error) => {
      console.error('Error marking payment as paid:', error);
      toast.error('Error al marcar el pago');
    },
  });
}

// ===== UTILITY HOOKS =====

// Get payment statistics for a club
export function usePaymentStats(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['student-payments', 'stats', targetClubId],
    queryFn: async () => {
      if (!targetClubId) return null;

      const { data, error } = await supabase
        .from('student_payments')
        .select('status, amount')
        .eq('club_id', targetClubId);

      if (error) throw error;

      const stats = {
        total: 0,
        totalAmount: 0,
        pending: 0,
        pendingAmount: 0,
        inReview: 0,
        inReviewAmount: 0,
        paid: 0,
        paidAmount: 0,
      };

      data?.forEach(payment => {
        stats.total++;
        stats.totalAmount += payment.amount;

        switch (payment.status) {
          case 'pendiente':
            stats.pending++;
            stats.pendingAmount += payment.amount;
            break;
          case 'en_revision':
            stats.inReview++;
            stats.inReviewAmount += payment.amount;
            break;
          case 'pagado':
            stats.paid++;
            stats.paidAmount += payment.amount;
            break;
        }
      });

      return stats;
    },
    enabled: !!targetClubId,
  });
}

// Generate payment for an assignment (calls the database function)
export function useGeneratePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      periodStart,
      periodEnd,
      classesCount,
    }: {
      assignmentId: string;
      periodStart: string;
      periodEnd: string;
      classesCount?: number;
    }) => {
      const { data, error } = await supabase.rpc('generate_payment_for_assignment', {
        p_assignment_id: assignmentId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_classes_count: classesCount || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      toast.success('Pago generado correctamente');
    },
    onError: (error: Error) => {
      console.error('Error generating payment:', error);
      toast.error('Error al generar el pago');
    },
  });
}

// Generate payments for all active assignments in a club for current period
export function useGenerateMonthlyPayments() {
  const queryClient = useQueryClient();
  const { effectiveClubId } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!effectiveClubId) throw new Error('No club selected');

      // Get current month period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const periodStartStr = periodStart.toISOString().split('T')[0];
      const periodEndStr = periodEnd.toISOString().split('T')[0];

      // Get all active assignments with their rates
      const { data: assignments, error: assignmentsError } = await supabase
        .from('student_rate_assignments')
        .select(`
          id,
          student_enrollment_id,
          payment_rate_id,
          start_date,
          end_date,
          payment_rate:payment_rates(
            id,
            club_id,
            rate_type,
            fixed_price,
            price_per_class,
            due_days
          ),
          student_enrollment:student_enrollments(
            id,
            club_id
          )
        `)
        .eq('status', 'activa');

      if (assignmentsError) throw assignmentsError;

      // Filter assignments for this club
      const clubAssignments = assignments?.filter(
        a => a.student_enrollment?.club_id === effectiveClubId
      ) || [];

      if (clubAssignments.length === 0) {
        throw new Error('No hay asignaciones activas para generar pagos');
      }

      // Check which assignments already have a payment for this period
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('student_payments')
        .select('rate_assignment_id, period_start')
        .eq('club_id', effectiveClubId)
        .gte('period_start', periodStartStr)
        .lte('period_start', periodEndStr);

      if (paymentsError) throw paymentsError;

      const existingAssignmentIds = new Set(
        existingPayments?.map(p => p.rate_assignment_id) || []
      );

      // Generate payments for assignments without one this period
      const results = [];
      const errors = [];

      for (const assignment of clubAssignments) {
        // Skip if already has payment for this period
        if (existingAssignmentIds.has(assignment.id)) {
          continue;
        }

        // Skip if assignment started after this period
        if (assignment.start_date > periodEndStr) {
          continue;
        }

        // Skip if assignment ended before this period
        if (assignment.end_date && assignment.end_date < periodStartStr) {
          continue;
        }

        const rate = assignment.payment_rate;
        if (!rate) continue;

        // For fixed price rates, generate directly
        if (rate.rate_type === 'fija' && rate.fixed_price) {
          try {
            const { data, error } = await supabase.rpc('generate_payment_for_assignment', {
              p_assignment_id: assignment.id,
              p_period_start: periodStartStr,
              p_period_end: periodEndStr,
              p_classes_count: null,
            });

            if (error) {
              errors.push({ assignment: assignment.id, error: error.message });
            } else {
              results.push(data);
            }
          } catch (err) {
            errors.push({ assignment: assignment.id, error: String(err) });
          }
        }
        // For per-class rates, we need to count classes - skip for now
        // (will be implemented with automation)
      }

      return { generated: results.length, errors, skipped: existingAssignmentIds.size };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      if (data.generated > 0) {
        toast.success(`${data.generated} pagos generados correctamente`);
      } else if (data.skipped > 0) {
        toast.info('Ya existen pagos para este período');
      } else {
        toast.info('No se generaron nuevos pagos');
      }
    },
    onError: (error: Error) => {
      console.error('Error generating monthly payments:', error);
      toast.error(error.message || 'Error al generar los pagos');
    },
  });
}
