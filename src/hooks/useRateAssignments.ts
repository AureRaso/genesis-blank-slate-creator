import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PaymentRate } from "./usePaymentRates";

// Types
export interface RateAssignment {
  id: string;
  student_enrollment_id: string;
  payment_rate_id: string;
  start_date: string;
  end_date: string | null;
  status: 'activa' | 'pausada' | 'finalizada';
  created_at: string;
  updated_at: string;
  // Joined data
  payment_rate?: PaymentRate;
  student_enrollment?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export interface StudentWithAssignment {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  club_id: string;
  current_assignment?: RateAssignment | null;
  weekly_hours: number; // Calculated from class_participants and programmed_classes
}

export interface CreateAssignmentInput {
  student_enrollment_id: string;
  payment_rate_id: string;
  start_date: string;
  end_date?: string | null;
}

export interface BulkAssignmentInput {
  student_enrollment_ids: string[];
  payment_rate_id: string;
  start_date: string;
  end_date?: string | null;
}

// Fetch students with their current rate assignment and weekly hours
export function useStudentsWithAssignments(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['students-with-assignments', targetClubId],
    queryFn: async () => {
      if (!targetClubId) return [];

      // Fetch all students in the club
      const { data: students, error: studentsError } = await supabase
        .from('student_enrollments')
        .select('id, full_name, email, phone, club_id')
        .eq('club_id', targetClubId)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch assignments in batches to avoid URL length limits
      const studentIds = students.map(s => s.id);
      const BATCH_SIZE = 50;
      const allAssignments: RateAssignment[] = [];

      for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
        const batch = studentIds.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('student_rate_assignments')
          .select(`*, payment_rate:payment_rates(*)`)
          .in('student_enrollment_id', batch)
          .eq('status', 'activa');
        if (error) throw error;
        if (data) allAssignments.push(...(data as RateAssignment[]));
      }

      // Fetch class participations in batches to avoid PostgREST 1000-row limit
      // (a club with 100 students can have 3000+ participations)
      // Use small batches (10 students) and internal pagination to guarantee completeness
      interface ParticipationRow {
        student_enrollment_id: string;
        class_id: string;
        programmed_class: {
          id: string;
          days_of_week: string[] | null;
          start_time: string;
          duration_minutes: number;
          is_active: boolean;
        } | null;
      }
      const allParticipations: ParticipationRow[] = [];
      const PARTICIPATION_BATCH = 10; // Smaller batches to stay under 1000-row limit
      const PAGE_SIZE = 1000;

      for (let i = 0; i < studentIds.length; i += PARTICIPATION_BATCH) {
        const batch = studentIds.slice(i, i + PARTICIPATION_BATCH);
        // Paginate within each batch to handle cases where even 10 students exceed 1000 rows
        let offset = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('class_participants')
            .select('student_enrollment_id, class_id, programmed_class:programmed_classes(id, days_of_week, start_time, duration_minutes, is_active)')
            .in('student_enrollment_id', batch)
            .eq('status', 'active')
            .range(offset, offset + PAGE_SIZE - 1);
          if (error) throw error;
          if (data) {
            allParticipations.push(...(data as ParticipationRow[]));
            hasMore = data.length === PAGE_SIZE;
            offset += PAGE_SIZE;
          } else {
            hasMore = false;
          }
        }
      }

      // Calculate weekly hours per student from participations
      const hoursByStudent = new Map<string, number>();
      const studentParticipations = new Map<string, ParticipationRow[]>();

      allParticipations.forEach(p => {
        if (!p.programmed_class || !p.programmed_class.is_active) return;
        const list = studentParticipations.get(p.student_enrollment_id) || [];
        list.push(p);
        studentParticipations.set(p.student_enrollment_id, list);
      });

      studentParticipations.forEach((participations, studentId) => {
        // Deduplicate by class_id
        const uniqueClasses = new Map<string, ParticipationRow>();
        participations.forEach(p => {
          if (!uniqueClasses.has(p.class_id)) {
            uniqueClasses.set(p.class_id, p);
          }
        });

        // Expand days_of_week and deduplicate by day+time slot
        const uniqueSlots = new Set<string>();
        let totalMinutes = 0;

        uniqueClasses.forEach(p => {
          const pc = p.programmed_class!;
          const days = pc.days_of_week || [];
          days.forEach(day => {
            const slotKey = `${day}|${pc.start_time}`;
            if (!uniqueSlots.has(slotKey)) {
              uniqueSlots.add(slotKey);
              totalMinutes += pc.duration_minutes;
            }
          });
        });

        hoursByStudent.set(studentId, Math.round((totalMinutes / 60) * 10) / 10);
      });

      // Map assignments to students
      const assignmentsByStudent = new Map<string, RateAssignment>();
      allAssignments.forEach(a => {
        assignmentsByStudent.set(a.student_enrollment_id, a);
      });

      return students.map(student => ({
        ...student,
        current_assignment: assignmentsByStudent.get(student.id) || null,
        weekly_hours: hoursByStudent.get(student.id) || 0,
      })) as StudentWithAssignment[];
    },
    enabled: !!targetClubId,
  });
}

// Fetch all assignments for a club (with details)
export function useRateAssignments(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['rate-assignments', targetClubId],
    queryFn: async () => {
      if (!targetClubId) return [];

      const { data, error } = await supabase
        .from('student_rate_assignments')
        .select(`
          *,
          payment_rate:payment_rates(*),
          student_enrollment:student_enrollments(id, full_name, email, phone)
        `)
        .eq('payment_rate.club_id', targetClubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RateAssignment[];
    },
    enabled: !!targetClubId,
  });
}

// Create a single assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      // First, finalize any existing active assignments for this student
      const { error: updateError } = await supabase
        .from('student_rate_assignments')
        .update({ status: 'finalizada', end_date: new Date().toISOString().split('T')[0] })
        .eq('student_enrollment_id', input.student_enrollment_id)
        .eq('status', 'activa');

      if (updateError) throw updateError;

      // Create new assignment
      const { data, error } = await supabase
        .from('student_rate_assignments')
        .insert({
          student_enrollment_id: input.student_enrollment_id,
          payment_rate_id: input.payment_rate_id,
          start_date: input.start_date,
          end_date: input.end_date || null,
          status: 'activa',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-with-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rate-assignments'] });
      toast.success('Tarifa asignada correctamente');
    },
    onError: (error: Error) => {
      console.error('Error creating assignment:', error);
      toast.error('Error al asignar la tarifa');
    },
  });
}

// Bulk assign rate to multiple students
export function useBulkAssignRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkAssignmentInput) => {
      const results = [];

      for (const studentId of input.student_enrollment_ids) {
        // Finalize existing active assignments
        await supabase
          .from('student_rate_assignments')
          .update({ status: 'finalizada', end_date: new Date().toISOString().split('T')[0] })
          .eq('student_enrollment_id', studentId)
          .eq('status', 'activa');

        // Create new assignment
        const { data, error } = await supabase
          .from('student_rate_assignments')
          .insert({
            student_enrollment_id: studentId,
            payment_rate_id: input.payment_rate_id,
            start_date: input.start_date,
            end_date: input.end_date || null,
            status: 'activa',
          })
          .select()
          .single();

        if (error) {
          console.error(`Error assigning rate to student ${studentId}:`, error);
        } else {
          results.push(data);
        }
      }

      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students-with-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rate-assignments'] });
      toast.success(`Tarifa asignada a ${data.length} alumnos`);
    },
    onError: (error: Error) => {
      console.error('Error in bulk assignment:', error);
      toast.error('Error al asignar las tarifas');
    },
  });
}

// Update assignment status
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'activa' | 'pausada' | 'finalizada' }) => {
      const updates: Record<string, unknown> = { status };

      if (status === 'finalizada') {
        updates.end_date = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('student_rate_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-with-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rate-assignments'] });
      toast.success('Asignación actualizada');
    },
    onError: (error: Error) => {
      console.error('Error updating assignment:', error);
      toast.error('Error al actualizar la asignación');
    },
  });
}

// Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_rate_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-with-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rate-assignments'] });
      toast.success('Asignación eliminada');
    },
    onError: (error: Error) => {
      console.error('Error deleting assignment:', error);
      toast.error('Error al eliminar la asignación');
    },
  });
}
