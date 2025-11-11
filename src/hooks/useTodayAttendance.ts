import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

export interface TodayAttendanceClass {
  id: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  max_participants?: number;
  days_of_week?: string[]; // Added to support week view filtering
  trainer: {
    full_name: string;
  } | null;
  participants: {
    id: string;
    student_enrollment: {
      full_name: string;
      email: string;
    };
    attendance_confirmed_for_date: string | null;
    attendance_confirmed_at: string | null;
    absence_confirmed: boolean | null;
    absence_reason: string | null;
    absence_confirmed_at: string | null;
    is_substitute: boolean | null;
    joined_from_waitlist_at: string | null;
  }[];
}

// Get day of week in Spanish format used in database
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

// Hook for admins/trainers to see classes in a date range with attendance confirmations
// If no startDate/endDate provided, defaults to today
export const useTodayAttendance = (startDate?: string, endDate?: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Use provided dates or default to today
  const queryStartDate = startDate || today;
  const queryEndDate = endDate || today;

  // Get all days in the range
  const daysInRange: string[] = [];
  const start = new Date(queryStartDate);
  const end = new Date(queryEndDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    daysInRange.push(getDayOfWeekInSpanish(d));
  }

  // Remove duplicates
  const uniqueDays = Array.from(new Set(daysInRange));

  const query = useQuery({
    queryKey: ['today-attendance', profile?.id, queryStartDate, queryEndDate],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');


      // Get all programmed classes that have any day of the week in the range
      let query = supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          duration_minutes,
          days_of_week,
          start_date,
          end_date,
          club_id,
          max_participants,
          trainer:profiles!trainer_profile_id(
            full_name
          ),
          participants:class_participants(
            id,
            status,
            attendance_confirmed_for_date,
            attendance_confirmed_at,
            absence_confirmed,
            absence_reason,
            absence_confirmed_at,
            is_substitute,
            joined_from_waitlist_at,
            student_enrollment:student_enrollments!student_enrollment_id(
              full_name,
              email
            )
          )
        `)
        .eq('is_active', true)
        .lte('start_date', queryEndDate)
        .gte('end_date', queryStartDate);

      // If trainer, filter by classes assigned to them (regardless of club)
      if (profile.role === 'trainer') {
        query = query.eq('trainer_profile_id', profile.id);
      } else {
        // For admins, filter by club if they have one assigned
        if (profile.club_id) {
          query = query.eq('club_id', profile.club_id);
        }
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;

      console.log('📊 Week attendance data:', {
        classCount: data?.length || 0,
        error,
        dateRange: { queryStartDate, queryEndDate }
      });

      if (error) {
        console.error('❌ Error fetching today attendance:', error);
        throw error;
      }

      // Filter and format the data - only include classes that have days matching the date range
      const filteredClasses = (data || []).filter((classData: any) => {
        const classDays = classData.days_of_week || [];
        return classDays.some((day: string) => uniqueDays.includes(day));
      });

      const weekClasses = filteredClasses.map((classData: any) => ({
        id: classData.id,
        name: classData.name,
        start_time: classData.start_time,
        duration_minutes: classData.duration_minutes,
        max_participants: classData.max_participants,
        trainer: classData.trainer,
        days_of_week: classData.days_of_week, // Include days for filtering in component
        participants: (classData.participants || [])
          .filter((p: any) => p.status === 'active')
          .map((p: any) => ({
            id: p.id,
            student_enrollment: p.student_enrollment,
            attendance_confirmed_for_date: p.attendance_confirmed_for_date,
            attendance_confirmed_at: p.attendance_confirmed_at,
            absence_confirmed: p.absence_confirmed,
            absence_reason: p.absence_reason,
            absence_confirmed_at: p.absence_confirmed_at,
            is_substitute: p.is_substitute,
            joined_from_waitlist_at: p.joined_from_waitlist_at
          }))
      })) as TodayAttendanceClass[];

      console.log('✅ Final week classes with attendance:', weekClasses);
      return weekClasses;
    },
    enabled: !!profile?.id,
    // Refetch on window focus as fallback (Realtime handles live updates)
    refetchOnWindowFocus: true,
  });

  // Setup Realtime subscription for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    console.log('🔌 Setting up Realtime subscription for class_participants table');
    console.log('🔍 Current user profile:', { id: profile.id, role: profile.role, email: profile.email });

    // Subscribe to changes in class_participants table
    // Note: For this to work, the user must have SELECT permission on class_participants
    // via RLS policies (Row Level Security)
    const channel = supabase
      .channel('today-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'class_participants',
        },
        (payload) => {
          console.log('🔔 Realtime update received (class_participants):', {
            eventType: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
          });

          // Invalidate and refetch ALL today-attendance queries
          queryClient.invalidateQueries({
            queryKey: ['today-attendance']
          });
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 Realtime subscription status:', status);
        if (err) {
          console.error('❌ Realtime subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime successfully connected and listening for changes on class_participants');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error - check RLS policies on class_participants table');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [profile?.id, today, queryClient]);

  return query;
};

// Hook para que el profesor/admin marque asistencia manualmente del jugador
export const useTrainerMarkAttendance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({ participantId, scheduledDate }: { participantId: string; scheduledDate: string }) => {
      console.log('👨‍🏫 Trainer marking attendance for:', { participantId, scheduledDate });

      const { data, error } = await supabase
        .from('class_participants')
        .update({
          attendance_confirmed_for_date: scheduledDate,
          attendance_confirmed_at: new Date().toISOString(),
          // Limpiar ausencia si existía
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Attendance marked by trainer:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
      toast.success('✓ Asistencia confirmada por el profesor');
    },
    onError: (error: any) => {
      console.error('Error marking attendance:', error);
      toast.error('Error al confirmar asistencia');
    },
  });
};

// Hook para que el profesor/admin marque ausencia manualmente del jugador
export const useTrainerMarkAbsence = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({ participantId, reason }: { participantId: string; reason?: string }) => {
      console.log('👨‍🏫 Trainer marking absence for:', { participantId, reason });

      const { data, error } = await supabase
        .from('class_participants')
        .update({
          absence_confirmed: true,
          absence_reason: reason || 'Marcado por profesor',
          absence_confirmed_at: new Date().toISOString(),
          // Limpiar confirmación de asistencia si existía
          attendance_confirmed_for_date: null,
          attendance_confirmed_at: null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Absence marked by trainer:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
      toast.success('✓ Ausencia marcada por el profesor');
    },
    onError: (error: any) => {
      console.error('Error marking absence:', error);
      toast.error('Error al marcar ausencia');
    },
  });
};

// Hook para que el profesor/admin limpie el estado (volver a pendiente)
export const useTrainerClearStatus = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async (participantId: string) => {
      console.log('👨‍🏫 Trainer clearing status for:', participantId);

      const { data, error } = await supabase
        .from('class_participants')
        .update({
          attendance_confirmed_for_date: null,
          attendance_confirmed_at: null,
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Status cleared by trainer:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
      toast.success('✓ Estado limpiado');
    },
    onError: (error: any) => {
      console.error('Error clearing status:', error);
      toast.error('Error al limpiar estado');
    },
  });
};

// Hook para eliminar un participante (sustituto) de la clase
export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async (participantId: string) => {
      console.log('🗑️ Removing participant:', participantId);

      const { error } = await supabase
        .from('class_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      console.log('✅ Participant removed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
      toast.success('✓ Alumno eliminado de la clase');
    },
    onError: (error: any) => {
      console.error('Error removing participant:', error);
      toast.error('Error al eliminar alumno');
    },
  });
};

// Hook para cancelar una clase específica en una fecha (sin afectar la recurrencia)
export const useCancelClass = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({ classId, cancelledDate, reason }: { classId: string; cancelledDate: string; reason?: string }) => {
      console.log('🚫 Cancelling class:', { classId, cancelledDate, reason });

      if (!profile?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('cancelled_classes')
        .insert({
          programmed_class_id: classId,
          cancelled_date: cancelledDate,
          cancelled_by: profile.id,
          cancellation_reason: reason,
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Class cancelled:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['cancelled-classes'] });
      toast.success('✓ Clase cancelada correctamente');
    },
    onError: (error: any) => {
      console.error('Error cancelling class:', error);
      if (error.code === '23505') {
        toast.error('Esta clase ya está cancelada para esta fecha');
      } else {
        toast.error('Error al cancelar la clase');
      }
    },
  });
};

// Hook para obtener clases canceladas
export const useCancelledClasses = (startDate?: string, endDate?: string) => {
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const queryStartDate = startDate || today;
  const queryEndDate = endDate || today;

  return useQuery({
    queryKey: ['cancelled-classes', profile?.id, queryStartDate, queryEndDate],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('cancelled_classes')
        .select('*')
        .gte('cancelled_date', queryStartDate)
        .lte('cancelled_date', queryEndDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });
};
