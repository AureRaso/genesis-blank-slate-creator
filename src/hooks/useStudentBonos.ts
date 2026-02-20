import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import i18n from "@/i18n";

// Types
export interface StudentBono {
  id: string;
  club_id: string;
  student_enrollment_id: string;
  bono_template_id: string;
  total_classes: number;
  remaining_classes: number;
  price_paid: number;
  usage_type: 'fixed' | 'waitlist' | 'both';
  purchased_at: string;
  expires_at: string | null;
  status: 'activo' | 'agotado' | 'expirado' | 'cancelado';
  payment_id: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  bono_template?: {
    id: string;
    name: string;
    total_classes: number;
    price: number;
    validity_days: number | null;
    usage_type: 'fixed' | 'waitlist' | 'both';
  };
  student_enrollment?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export interface BonoUsage {
  id: string;
  student_bono_id: string;
  student_enrollment_id: string;
  class_participant_id: string | null;
  class_id: string | null;
  class_date: string | null;
  class_name: string | null;
  enrollment_type: 'fixed' | 'substitute' | null;
  used_at: string;
  reverted_at: string | null;
  reverted_reason: string | null;
  created_at: string;
}

export interface AssignBonoInput {
  student_enrollment_id: string;
  bono_template_id: string;
}

// Hook to fetch all bonos for a club (admin view)
export function useStudentBonos(clubId?: string, statusFilter?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['student-bonos', targetClubId, statusFilter],
    queryFn: async () => {
      if (!targetClubId) return [];

      let query = supabase
        .from('student_bonos')
        .select(`
          *,
          bono_template:bono_templates(id, name, total_classes, price, validity_days),
          student_enrollment:student_enrollments(id, full_name, email, phone)
        `)
        .eq('club_id', targetClubId)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StudentBono[];
    },
    enabled: !!targetClubId,
  });
}

// Hook to fetch player's own bonos
export function useMyBonos() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-bonos', 'my', profile?.id],
    queryFn: async () => {
      if (!profile?.email) return [];

      // Get student enrollments for this profile
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('email', profile.email);

      if (enrollmentError) throw enrollmentError;
      if (!enrollments || enrollments.length === 0) return [];

      const enrollmentIds = enrollments.map(e => e.id);

      // Get bonos for those enrollments
      const { data, error } = await supabase
        .from('student_bonos')
        .select(`
          *,
          bono_template:bono_templates(id, name, total_classes, price, validity_days)
        `)
        .in('student_enrollment_id', enrollmentIds)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data as StudentBono[];
    },
    enabled: !!profile?.email,
  });
}

// Hook to assign a bono to a student (creates bono + payment)
export function useAssignBono() {
  const queryClient = useQueryClient();
  const { effectiveClubId, profile } = useAuth();

  return useMutation({
    mutationFn: async (input: AssignBonoInput) => {
      if (!effectiveClubId) throw new Error('No club selected');

      // Get template info
      const { data: template, error: templateError } = await supabase
        .from('bono_templates')
        .select('*')
        .eq('id', input.bono_template_id)
        .single();

      if (templateError) throw templateError;

      // Calculate expires_at if template has validity_days
      let expiresAt: string | null = null;
      if (template.validity_days) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + template.validity_days);
        expiresAt = expDate.toISOString();
      }

      // Create payment record first
      const { data: payment, error: paymentError } = await supabase
        .from('student_payments')
        .insert({
          club_id: effectiveClubId,
          student_enrollment_id: input.student_enrollment_id,
          concept: `Bono: ${template.name}`,
          description: `Pack de ${template.total_classes} clases`,
          amount: template.price,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pendiente',
          is_extra_payment: false,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create bono record (snapshot usage_type from template)
      const { data: bono, error: bonoError } = await supabase
        .from('student_bonos')
        .insert({
          club_id: effectiveClubId,
          student_enrollment_id: input.student_enrollment_id,
          bono_template_id: input.bono_template_id,
          total_classes: template.total_classes,
          remaining_classes: template.total_classes,
          price_paid: template.price,
          usage_type: template.usage_type || 'both',
          expires_at: expiresAt,
          payment_id: payment.id,
          assigned_by: profile?.id || null,
          status: 'activo',
        })
        .select()
        .single();

      if (bonoError) throw bonoError;

      return bono;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-bonos'] });
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      toast.success(i18n.t('bonoTemplates.toasts.assigned'));
    },
    onError: (error: Error) => {
      console.error('Error assigning bono:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorAssigning'));
    },
  });
}

// Hook to bulk assign a bono to multiple students
export function useBulkAssignBono() {
  const queryClient = useQueryClient();
  const { effectiveClubId, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      bonoTemplateId,
      studentEnrollmentIds,
    }: {
      bonoTemplateId: string;
      studentEnrollmentIds: string[];
    }) => {
      if (!effectiveClubId) throw new Error('No club selected');

      // Get template info
      const { data: template, error: templateError } = await supabase
        .from('bono_templates')
        .select('*')
        .eq('id', bonoTemplateId)
        .single();

      if (templateError) throw templateError;

      // Calculate expires_at
      let expiresAt: string | null = null;
      if (template.validity_days) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + template.validity_days);
        expiresAt = expDate.toISOString();
      }

      const results = { success: 0, errors: 0 };

      for (const enrollmentId of studentEnrollmentIds) {
        try {
          // Create payment
          const { data: payment, error: paymentError } = await supabase
            .from('student_payments')
            .insert({
              club_id: effectiveClubId,
              student_enrollment_id: enrollmentId,
              concept: `Bono: ${template.name}`,
              description: `Pack de ${template.total_classes} clases`,
              amount: template.price,
              issue_date: new Date().toISOString().split('T')[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pendiente',
              is_extra_payment: false,
            })
            .select()
            .single();

          if (paymentError) throw paymentError;

          // Create bono (snapshot usage_type from template)
          const { error: bonoError } = await supabase
            .from('student_bonos')
            .insert({
              club_id: effectiveClubId,
              student_enrollment_id: enrollmentId,
              bono_template_id: bonoTemplateId,
              total_classes: template.total_classes,
              remaining_classes: template.total_classes,
              price_paid: template.price,
              usage_type: template.usage_type || 'both',
              expires_at: expiresAt,
              payment_id: payment.id,
              assigned_by: profile?.id || null,
              status: 'activo',
            });

          if (bonoError) throw bonoError;
          results.success++;
        } catch (err) {
          console.error('Error assigning bono to student:', enrollmentId, err);
          results.errors++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['student-bonos'] });
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      if (results.success > 0) {
        toast.success(i18n.t('bonoTemplates.toasts.bulkAssigned', { count: results.success }));
      }
      if (results.errors > 0) {
        toast.error(i18n.t('bonoTemplates.toasts.bulkErrors', { count: results.errors }));
      }
    },
    onError: (error: Error) => {
      console.error('Error bulk assigning bonos:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorAssigning'));
    },
  });
}

// Hook to cancel a bono
export function useCancelBono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bonoId: string) => {
      const { error } = await supabase
        .from('student_bonos')
        .update({ status: 'cancelado' })
        .eq('id', bonoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-bonos'] });
      toast.success(i18n.t('bonoTemplates.toasts.cancelled'));
    },
    onError: (error: Error) => {
      console.error('Error cancelling bono:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorCancelling'));
    },
  });
}

// Hook to get bono usage history
export function useBonoUsageHistory(bonoId: string | undefined) {
  return useQuery({
    queryKey: ['bono-usages', bonoId],
    queryFn: async () => {
      if (!bonoId) return [];

      const { data, error } = await supabase
        .from('student_bono_usages')
        .select('*')
        .eq('student_bono_id', bonoId)
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data as BonoUsage[];
    },
    enabled: !!bonoId,
  });
}

// Hook to deduct a class from a bono (RPC)
export function useDeductBonoClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentEnrollmentId,
      classParticipantId,
      classId,
      classDate,
      isWaitlist = false,
      className,
      enrollmentType,
    }: {
      studentEnrollmentId: string;
      classParticipantId?: string;
      classId?: string;
      classDate?: string;
      isWaitlist?: boolean;
      className?: string;
      enrollmentType?: 'fixed' | 'substitute';
    }) => {
      const { data, error } = await supabase.rpc('deduct_bono_class', {
        p_student_enrollment_id: studentEnrollmentId,
        p_class_participant_id: classParticipantId || null,
        p_class_id: classId || null,
        p_class_date: classDate || null,
        p_is_waitlist: isWaitlist,
        p_class_name: className || null,
        p_enrollment_type: enrollmentType || null,
      });

      if (error) throw error;
      return data as { success: boolean; error?: string; bono_id?: string; usage_id?: string; remaining?: number; bono_name?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-bonos'] });
      queryClient.invalidateQueries({ queryKey: ['bono-usages'] });
    },
  });
}

// Hook to fetch active bonos summary for a list of student_enrollment_ids
// Returns a Map<student_enrollment_id, { remaining_classes, total_classes, bono_name }>
export function useParticipantActiveBonos(studentEnrollmentIds: string[]) {
  return useQuery({
    queryKey: ['participant-active-bonos', ...studentEnrollmentIds.sort()],
    queryFn: async () => {
      if (studentEnrollmentIds.length === 0) return new Map<string, { remaining_classes: number; total_classes: number; bono_name: string }>();

      const { data, error } = await supabase
        .from('student_bonos')
        .select(`
          student_enrollment_id,
          remaining_classes,
          total_classes,
          bono_template:bono_templates(name)
        `)
        .in('student_enrollment_id', studentEnrollmentIds)
        .eq('status', 'activo')
        .gt('remaining_classes', 0);

      if (error) throw error;

      // Group by student_enrollment_id - sum all active bonos per student
      const bonoMap = new Map<string, { remaining_classes: number; total_classes: number; bono_name: string }>();

      for (const bono of (data || [])) {
        const existing = bonoMap.get(bono.student_enrollment_id);
        const name = (bono.bono_template as any)?.name || 'Bono';
        if (existing) {
          existing.remaining_classes += bono.remaining_classes;
          existing.total_classes += bono.total_classes;
        } else {
          bonoMap.set(bono.student_enrollment_id, {
            remaining_classes: bono.remaining_classes,
            total_classes: bono.total_classes,
            bono_name: name,
          });
        }
      }

      return bonoMap;
    },
    enabled: studentEnrollmentIds.length > 0,
  });
}

// Hook to revert a bono usage (RPC)
export function useRevertBonoUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      usageId,
      reason,
    }: {
      usageId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc('revert_bono_usage', {
        p_usage_id: usageId,
        p_reason: reason || 'Clase cancelada',
      });

      if (error) throw error;
      return data as { success: boolean; error?: string; bono_id?: string; remaining?: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-bonos'] });
      queryClient.invalidateQueries({ queryKey: ['bono-usages'] });
    },
  });
}