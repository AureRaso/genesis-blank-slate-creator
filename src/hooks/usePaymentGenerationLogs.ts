import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import i18n from "@/i18n";

// Types
export interface PaymentGenerationLog {
  id: string;
  executed_at: string;
  billing_day: number;
  target_month: number;
  target_year: number;
  total_assignments_processed: number;
  payments_generated: number;
  payments_skipped: number;
  errors_count: number;
  details: PaymentGenerationDetail[];
  errors: PaymentGenerationError[];
  execution_time_ms: number | null;
  triggered_by: 'cron' | 'manual' | 'test';
}

export interface PaymentGenerationDetail {
  assignment_id: string;
  student_name: string;
  status: 'generated' | 'skipped';
  reason?: string;
  payment_id?: string;
  existing_payment_id?: string;
  rate_type?: 'fija' | 'por_clase';
  classes_count?: number | null;
}

export interface PaymentGenerationError {
  assignment_id: string;
  student_name: string;
  error: string;
}

export interface GeneratePaymentsResult {
  success: boolean;
  log_id: string;
  billing_day: number;
  target_period: string;
  total_processed: number;
  generated: number;
  skipped: number;
  errors: number;
  execution_time_ms: number;
}

// ===== HOOKS =====

// Fetch recent payment generation logs
export function usePaymentGenerationLogs(limit: number = 10) {
  return useQuery({
    queryKey: ['payment-generation-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_generation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PaymentGenerationLog[];
    },
  });
}

// Fetch a single log with full details
export function usePaymentGenerationLog(logId: string | null) {
  return useQuery({
    queryKey: ['payment-generation-log', logId],
    queryFn: async () => {
      if (!logId) return null;

      const { data, error } = await supabase
        .from('payment_generation_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (error) throw error;
      return data as PaymentGenerationLog;
    },
    enabled: !!logId,
  });
}

// Manually trigger payment generation
export function useManualPaymentGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billingDay,
      targetMonth,
      targetYear,
      clubId,
    }: {
      billingDay?: number;
      targetMonth?: number;
      targetYear?: number;
      clubId?: string;
    } = {}) => {
      // Use RPC function directly instead of Edge Function for better reliability
      const { data, error } = await supabase.rpc('auto_generate_monthly_payments', {
        p_billing_day: billingDay ?? new Date().getDate(),
        p_target_month: targetMonth ?? null,
        p_target_year: targetYear ?? null,
        p_triggered_by: 'manual',
        p_club_id: clubId ?? null,
      });

      if (error) throw error;
      return data as GeneratePaymentsResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-generation-logs'] });
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });

      if (data.generated > 0) {
        toast.success(
          i18n.t('paymentControl.toasts.autoGenerationSuccess', {
            count: data.generated,
            period: data.target_period,
          })
        );
      } else if (data.skipped > 0) {
        toast.info(
          i18n.t('paymentControl.toasts.autoGenerationSkipped', {
            count: data.skipped,
          })
        );
      } else {
        toast.info(i18n.t('paymentControl.toasts.noAssignmentsToProcess'));
      }

      if (data.errors > 0) {
        toast.warning(
          i18n.t('paymentControl.toasts.autoGenerationErrors', {
            count: data.errors,
          })
        );
      }
    },
    onError: (error: Error) => {
      console.error('Error generating payments:', error);
      toast.error(i18n.t('paymentControl.toasts.errorAutoGeneration'));
    },
  });
}

// Generate payments for all billing days (useful for month start)
export function useGenerateAllBillingDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetMonth,
      targetYear,
      clubId,
    }: {
      targetMonth?: number;
      targetYear?: number;
      clubId?: string;
    } = {}) => {
      const results: GeneratePaymentsResult[] = [];

      // Generate for all billing days 1-28
      for (let billingDay = 1; billingDay <= 28; billingDay++) {
        const { data, error } = await supabase.rpc('auto_generate_monthly_payments', {
          p_billing_day: billingDay,
          p_target_month: targetMonth ?? null,
          p_target_year: targetYear ?? null,
          p_triggered_by: 'manual',
          p_club_id: clubId ?? null,
        });

        if (error) {
          console.error(`Error generating for billing day ${billingDay}:`, error);
          continue;
        }

        if (data) {
          results.push(data as GeneratePaymentsResult);
        }
      }

      // Aggregate results
      const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      return {
        totalGenerated,
        totalSkipped,
        totalErrors,
        results,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-generation-logs'] });
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });

      if (data.totalGenerated > 0) {
        toast.success(
          i18n.t('paymentControl.toasts.bulkGenerationSuccess', {
            count: data.totalGenerated,
          })
        );
      } else {
        toast.info(i18n.t('paymentControl.toasts.noNewPayments'));
      }
    },
    onError: (error: Error) => {
      console.error('Error in bulk generation:', error);
      toast.error(i18n.t('paymentControl.toasts.errorAutoGeneration'));
    },
  });
}
