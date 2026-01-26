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

// Helper function to calculate weekly hours from class participations
// Groups classes by day_of_week + start_time to avoid counting duplicate sessions
function calculateWeeklyHours(
  participations: Array<{
    programmed_class: {
      id: string;
      duration_minutes: number;
      days_of_week: string[];
      is_active: boolean;
      recurrence_type: string | null;
      start_date: string | null;
      end_date: string | null;
      start_time: string | null;
    } | null;
  }>
): number {
  let totalMinutes = 0;

  // Use a Map to track unique class slots (day + time) with their duration and recurrence type
  // Key: "day-time", Value: { duration, recurrenceType, count }
  const slotInfo = new Map<string, { duration: number; recurrenceType: string; count: number }>();

  participations.forEach((p) => {
    const programmedClass = p.programmed_class;
    if (!programmedClass || !programmedClass.is_active) return;

    const durationMinutes = programmedClass.duration_minutes || 60;
    const recurrenceType = programmedClass.recurrence_type || 'weekly';
    const startTime = programmedClass.start_time || '00:00';

    // For each day of the week this class occurs
    const daysOfWeek = programmedClass.days_of_week || [];
    daysOfWeek.forEach(day => {
      // Create a unique key for this time slot (day + time)
      const slotKey = `${day}-${startTime}`;

      const existing = slotInfo.get(slotKey);
      if (existing) {
        // Increment count for this slot
        existing.count++;
        // If any class in this slot is 'weekly', treat the whole slot as weekly
        if (recurrenceType === 'weekly') {
          existing.recurrenceType = 'weekly';
        } else if (recurrenceType === 'biweekly' && existing.recurrenceType === 'once') {
          existing.recurrenceType = 'biweekly';
        }
      } else {
        slotInfo.set(slotKey, { duration: durationMinutes, recurrenceType, count: 1 });
      }
    });
  });

  // Now calculate total minutes based on slot info
  slotInfo.forEach(({ duration, recurrenceType, count }) => {
    if (recurrenceType === 'weekly') {
      totalMinutes += duration;
    } else if (recurrenceType === 'biweekly') {
      // Biweekly = every 2 weeks, so average per week is half
      totalMinutes += duration / 2;
    } else if (recurrenceType === 'once' && count >= 2) {
      // Multiple 'once' classes in the same slot indicate a recurring pattern
      // Treat as weekly
      totalMinutes += duration;
    }
    // Single 'once' class is not counted as it's truly a one-time event
  });

  // Convert to hours, rounded to 1 decimal place
  return Math.round((totalMinutes / 60) * 10) / 10;
}

// Fetch students with their current rate assignment
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

      // Fetch active assignments for these students
      const studentIds = students.map(s => s.id);

      const { data: assignments, error: assignmentsError } = await supabase
        .from('student_rate_assignments')
        .select(`
          *,
          payment_rate:payment_rates(*)
        `)
        .in('student_enrollment_id', studentIds)
        .eq('status', 'activa');

      if (assignmentsError) throw assignmentsError;

      // Fetch class participations for these students to calculate weekly hours
      const { data: classParticipants, error: participantsError } = await supabase
        .from('class_participants')
        .select(`
          student_enrollment_id,
          programmed_class:programmed_classes(
            id,
            duration_minutes,
            days_of_week,
            is_active,
            recurrence_type,
            start_date,
            end_date,
            start_time
          )
        `)
        .in('student_enrollment_id', studentIds)
        .eq('status', 'active');

      if (participantsError) throw participantsError;

      // Map assignments to students
      const assignmentsByStudent = new Map<string, RateAssignment>();
      assignments?.forEach(a => {
        assignmentsByStudent.set(a.student_enrollment_id, a as RateAssignment);
      });

      // Group class participations by student
      const participationsByStudent = new Map<string, typeof classParticipants>();
      classParticipants?.forEach(p => {
        const existing = participationsByStudent.get(p.student_enrollment_id) || [];
        existing.push(p);
        participationsByStudent.set(p.student_enrollment_id, existing);
      });

      return students.map(student => ({
        ...student,
        current_assignment: assignmentsByStudent.get(student.id) || null,
        weekly_hours: calculateWeeklyHours(participationsByStudent.get(student.id) || []),
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
