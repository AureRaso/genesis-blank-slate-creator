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

// Hook for admins/trainers to see all today's classes with attendance confirmations
export const useTodayAttendance = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const todayDayName = getDayOfWeekInSpanish(new Date());

  const query = useQuery({
    queryKey: ['today-attendance', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('🔍 DEBUG - useTodayAttendance:', {
        profileId: profile.id,
        profileEmail: profile.email,
        profileRole: profile.role,
        profileClubId: profile.club_id,
        today,
        todayDayName
      });

      // Get all programmed classes for today in the user's club(s)
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
        .contains('days_of_week', [todayDayName])
        .lte('start_date', today)
        .gte('end_date', today);

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

      console.log('📊 Today attendance data:', { data, error });

      // Debug detallado de los participantes
      if (data && data.length > 0) {
        data.forEach(classItem => {
          console.log('📋 Clase:', classItem.name);
          classItem.participants?.forEach(p => {
            console.log('  👤 Participante:', {
              id: p.id,
              name: p.student_enrollment?.full_name,
              is_substitute: p.is_substitute,
              absence_confirmed: p.absence_confirmed,
              attendance_confirmed_for_date: p.attendance_confirmed_for_date
            });
          });
        });
      }

      if (error) {
        console.error('❌ Error fetching today attendance:', error);
        throw error;
      }

      // Filter and format the data
      const todayClasses = (data || []).map((classData: any) => ({
        id: classData.id,
        name: classData.name,
        start_time: classData.start_time,
        duration_minutes: classData.duration_minutes,
        trainer: classData.trainer,
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

      console.log('✅ Final today classes with attendance:', todayClasses);
      return todayClasses;
    },
    enabled: !!profile?.id,
    // Auto-refetch every 30 seconds as fallback
    refetchInterval: 30000,
    // Refetch on window focus
    refetchOnWindowFocus: true,
  });

  // Setup Realtime subscription for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    console.log('🔌 Setting up Realtime subscription for class_participants');

    // Subscribe to changes in class_participants table
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
          console.log('🔔 Realtime update received:', payload);

          // Invalidate and refetch the query when any change happens
          queryClient.invalidateQueries({
            queryKey: ['today-attendance', profile.id, today]
          });
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
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
