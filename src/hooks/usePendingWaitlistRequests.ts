import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface WaitlistRequest {
  id: string;
  class_id: string;
  user_id: string;
  student_enrollment_id: string;
  joined_at: string;
  status: string;
  position: number;
  programmed_class: {
    id: string;
    name: string;
    start_time: string;
    days_of_week: string[];
  };
  user_profile: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Helper function to get day of week in Spanish
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

/**
 * Hook to get pending waitlist requests for today's classes
 * Only shows 'waiting' status entries for classes happening today
 */
export const usePendingWaitlistRequests = (clubId?: string) => {
  return useQuery({
    queryKey: ['pending-waitlist-requests', clubId, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!clubId) return [];

      const today = format(new Date(), 'yyyy-MM-dd');

      // Get all pending waitlist entries with class details
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('class_waitlist')
        .select(`
          id,
          class_id,
          class_date,
          student_enrollment_id,
          requested_at,
          status,
          programmed_classes!inner(
            id,
            name,
            start_time,
            days_of_week,
            start_date,
            end_date,
            club_id,
            is_active
          )
        `)
        .eq('status', 'pending')
        .eq('programmed_classes.club_id', clubId)
        .order('requested_at', { ascending: true });

      if (waitlistError) {
        throw waitlistError;
      }

      if (!waitlistData || waitlistData.length === 0) {
        return [];
      }

      // Filter entries for classes happening today
      const todayWaitlistEntries = waitlistData.filter((entry: any) => {
        return entry.class_date === today;
      });

      if (todayWaitlistEntries.length === 0) {
        return [];
      }

      // Get student enrollment details for all waitlist entries
      const enrollmentIds = todayWaitlistEntries.map((entry: any) => entry.student_enrollment_id);
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select('id, full_name, email')
        .in('id', enrollmentIds);

      if (enrollmentsError) {
        throw enrollmentsError;
      }

      // Combine data
      const requests: WaitlistRequest[] = todayWaitlistEntries.map((entry: any) => {
        const enrollment = enrollments?.find((e: any) => e.id === entry.student_enrollment_id);
        return {
          id: entry.id,
          class_id: entry.class_id,
          user_id: '', // Not used since we don't have profile_id in student_enrollments
          student_enrollment_id: entry.student_enrollment_id,
          joined_at: entry.requested_at,
          status: entry.status,
          position: 0, // Position is not used in new system
          programmed_class: {
            id: entry.programmed_classes.id,
            name: entry.programmed_classes.name,
            start_time: entry.programmed_classes.start_time,
            days_of_week: entry.programmed_classes.days_of_week
          },
          user_profile: {
            id: '', // Not used since we don't have profile_id
            full_name: enrollment?.full_name || 'Usuario desconocido',
            email: enrollment?.email || ''
          }
        };
      });

      return requests;
    },
    enabled: !!clubId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to approve a waitlist request
 * This will convert the player to a class participant
 */
export const useApproveWaitlistRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ waitlistId, classId, userId }: { waitlistId: string; classId: string; userId: string }) => {
      // Get the waitlist entry to find student_enrollment_id and class_date
      const { data: waitlistEntry, error: waitlistFetchError } = await supabase
        .from('class_waitlist')
        .select('student_enrollment_id, class_date')
        .eq('id', waitlistId)
        .single();

      if (waitlistFetchError) throw waitlistFetchError;

      if (!waitlistEntry) {
        throw new Error('No se encontró la solicitud de lista de espera');
      }

      const now = new Date().toISOString();

      // Add the user as a participant in the class with substitute flag
      const { error: participantError } = await supabase
        .from('class_participants')
        .insert({
          class_id: classId,
          student_enrollment_id: waitlistEntry.student_enrollment_id,
          status: 'active',
          is_substitute: true,
          joined_from_waitlist_at: now,
          attendance_confirmed_for_date: waitlistEntry.class_date,
          attendance_confirmed_at: now
        });

      if (participantError) throw participantError;

      // Update waitlist status to 'accepted'
      const { error: updateError } = await supabase
        .from('class_waitlist')
        .update({
          status: 'accepted',
          accepted_at: now
        })
        .eq('id', waitlistId);

      if (updateError) throw updateError;

      return { waitlistId, classId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-waitlist-requests'] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-absences'] });
      queryClient.invalidateQueries({ queryKey: ['class-waitlist-details'] });

      toast({
        title: "Solicitud aprobada",
        description: "El jugador ha sido añadido a la clase.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to reject a waitlist request
 * This will update the status to 'skipped'
 */
export const useRejectWaitlistRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ waitlistId }: { waitlistId: string }) => {
      const { error } = await supabase
        .from('class_waitlist')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', waitlistId);

      if (error) throw error;

      return { waitlistId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-waitlist-requests'] });
      queryClient.invalidateQueries({ queryKey: ['class-waitlist-details'] });

      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    },
  });
};
