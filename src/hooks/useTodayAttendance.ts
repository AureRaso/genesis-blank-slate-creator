import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export interface TodayAttendanceClass {
  id: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  max_participants?: number;
  days_of_week?: string[]; // Added to support week view filtering
  club_id: string; // Added for student selector filtering
  club_language?: string; // Club's default language (es, en, it) for notifications
  trainer_profile_id: string; // Primary trainer ID for edit dialog
  trainer_profile_id_2?: string | null; // Secondary trainer ID for edit dialog
  trainer: {
    full_name: string;
  } | null;
  trainer_2?: {
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
    confirmed_by_trainer: boolean | null;
    absence_confirmed: boolean | null;
    absence_reason: string | null;
    absence_confirmed_at: string | null;
    is_substitute: boolean | null;
    joined_from_waitlist_at: string | null;
  }[];
}

// Get day of week in Spanish format used in database
// IMPORTANT: Use the EXACT format stored in the database (WITHOUT accents to match DB)
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

// Hook for admins/trainers to see classes in a date range with attendance confirmations
// If no startDate/endDate provided, defaults to today
export const useTodayAttendance = (startDate?: string, endDate?: string) => {
  const { profile, effectiveClubId, isSuperAdmin, superAdminClubs } = useAuth();
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

  // Get superadmin club IDs for query key (for cache invalidation)
  const superAdminClubIds = isSuperAdmin ? superAdminClubs.map(c => c.id) : [];

  const query = useQuery({
    queryKey: ['today-attendance', profile?.id, effectiveClubId, superAdminClubIds, queryStartDate, queryEndDate],
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
          trainer_profile_id,
          trainer_profile_id_2,
          clubs:club_id(
            default_language
          ),
          trainer:profiles!trainer_profile_id(
            full_name
          ),
          trainer_2:profiles!trainer_profile_id_2(
            full_name
          ),
          participants:class_participants(
            id,
            status,
            attendance_confirmed_for_date,
            attendance_confirmed_at,
            confirmed_by_trainer,
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

      // If trainer, filter by classes assigned to them (either as primary or secondary trainer)
      if (profile.role === 'trainer') {
        // Use OR filter to get classes where user is either trainer or trainer_2
        query = query.or(`trainer_profile_id.eq.${profile.id},trainer_profile_id_2.eq.${profile.id}`);
      } else {
        // For admins/superadmins, filter by club(s)
        if (effectiveClubId) {
          // Specific club selected
          query = query.eq('club_id', effectiveClubId);
        } else if (isSuperAdmin && superAdminClubs.length > 0) {
          // Superadmin with "All clubs" selected - filter by their assigned clubs
          const clubIds = superAdminClubs.map(c => c.id);
          query = query.in('club_id', clubIds);
        }
        // For regular admin without effectiveClubId, no additional filter (shows their club's classes)
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;


      if (error) {
        console.error('❌ Error fetching today attendance:', error);
        throw error;
      }

      // Helper function to normalize day names (remove accents for comparison)
      const normalizeDayName = (day: string): string => {
        return day
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""); // Remove accents
      };

      // Normalize uniqueDays for comparison
      const normalizedUniqueDays = uniqueDays.map(normalizeDayName);

      // Filter and format the data - only include classes that have days matching the date range
      const filteredClasses = (data || []).filter((classData: any) => {
        const classDays = classData.days_of_week || [];

        // Check if any class day matches any day in the range (normalize both for comparison)
        return classDays.some((day: string) =>
          normalizedUniqueDays.includes(normalizeDayName(day))
        );
      });

      // Since class_attendance_confirmations doesn't exist, we use class_participants directly
      // Create an empty confirmationsMap for backwards compatibility
      const confirmationsMap = new Map();

      const weekClasses = filteredClasses.map((classData: any) => ({
        id: classData.id,
        name: classData.name,
        start_time: classData.start_time,
        duration_minutes: classData.duration_minutes,
        max_participants: classData.max_participants,
        club_id: classData.club_id, // Include club_id for student selector filtering
        club_language: classData.clubs?.default_language || 'es', // Club's default language for notifications
        trainer_profile_id: classData.trainer_profile_id, // Include for edit dialog
        trainer_profile_id_2: classData.trainer_profile_id_2, // Include for edit dialog
        trainer: classData.trainer,
        trainer_2: classData.trainer_2, // Secondary trainer
        days_of_week: classData.days_of_week, // Include days for filtering in component
        participants: (classData.participants || [])
          .filter((p: any) => p.status === 'active')
          .map((p: any) => ({
            id: p.id,
            student_enrollment: p.student_enrollment,
            // Store base data from class_participants (fallback)
            attendance_confirmed_for_date: p.attendance_confirmed_for_date,
            attendance_confirmed_at: p.attendance_confirmed_at,
            confirmed_by_trainer: p.confirmed_by_trainer,
            absence_confirmed: p.absence_confirmed,
            absence_reason: p.absence_reason,
            absence_confirmed_at: p.absence_confirmed_at,
            is_substitute: p.is_substitute,
            joined_from_waitlist_at: p.joined_from_waitlist_at,
            // Store confirmations map for this participant (will be used in component)
            _confirmationsMap: confirmationsMap
          }))
      })) as any[];

      // Also return the confirmations map for use in components
      return { classes: weekClasses as TodayAttendanceClass[], confirmationsMap };
    },
    enabled: !!profile?.id,
    // Refetch on window focus as fallback (Realtime handles live updates)
    refetchOnWindowFocus: true,
  });

  // Setup Realtime subscription for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to changes in class_participants, programmed_classes, AND class_attendance_confirmations tables
    // This ensures we catch participant updates, class cancellations/deletions, and date-specific confirmations
    const channel = supabase
      .channel('today-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'class_participants',
        },
        () => {
          // Invalidate and refetch ALL today-attendance queries
          queryClient.invalidateQueries({
            queryKey: ['today-attendance']
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'programmed_classes',
        },
        () => {
          // Invalidate when classes are created, updated, or deleted
          queryClient.invalidateQueries({
            queryKey: ['today-attendance']
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'class_attendance_confirmations',
        },
        () => {
          // Invalidate when attendance confirmations are created, updated, or deleted
          queryClient.invalidateQueries({
            queryKey: ['today-attendance']
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, today, queryClient]);

  return query;
};

// Hook para que el profesor/admin marque asistencia manualmente del jugador
export const useTrainerMarkAttendance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ participantId, scheduledDate }: { participantId: string; scheduledDate: string }) => {
      console.log('👨‍🏫 Trainer marking attendance for:', { participantId, scheduledDate });

      // 1. Update class_participants
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('class_participants')
        .update({
          attendance_confirmed_for_date: scheduledDate,
          attendance_confirmed_at: new Date().toISOString(),
          confirmed_by_trainer: true,
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (updateError) {
        console.error('⚠️ [Trainer] Error updating participant:', updateError);
        throw updateError;
      }

      // 2. Also upsert into class_attendance_confirmations for player dashboard sync
      const { error: confirmationError } = await supabase
        .from('class_attendance_confirmations')
        .upsert({
          class_participant_id: participantId,
          scheduled_date: scheduledDate,
          attendance_confirmed: true,
          attendance_confirmed_at: new Date().toISOString(),
          confirmed_by_trainer: true,
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        }, {
          onConflict: 'class_participant_id,scheduled_date'
        });

      if (confirmationError) {
        console.error('⚠️ [Trainer] Error upserting confirmation:', confirmationError);
        // Don't throw - class_participants was updated successfully
      }

      console.log('✅ [Trainer] Attendance marked:', { participantId, scheduledDate });

      return updatedParticipant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
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

  return useMutation({
    mutationFn: async ({ participantId, scheduledDate, reason }: { participantId: string; scheduledDate?: string; reason?: string }) => {
      console.log('👨‍🏫 Trainer marking absence for:', { participantId, scheduledDate, reason });

      if (!scheduledDate) {
        throw new Error('scheduledDate is required to mark absence for a specific class occurrence');
      }

      // 1. Update class_participants
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('class_participants')
        .update({
          absence_confirmed: true,
          absence_reason: reason || 'Marcado por profesor',
          absence_confirmed_at: new Date().toISOString(),
          attendance_confirmed_for_date: null,
          attendance_confirmed_at: null,
          confirmed_by_trainer: true,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (updateError) {
        console.error('⚠️ [Trainer] Error updating participant:', updateError);
        throw updateError;
      }

      // 2. Also upsert into class_attendance_confirmations for player dashboard sync
      const { error: confirmationError } = await supabase
        .from('class_attendance_confirmations')
        .upsert({
          class_participant_id: participantId,
          scheduled_date: scheduledDate,
          attendance_confirmed: false,
          attendance_confirmed_at: null,
          confirmed_by_trainer: true,
          absence_confirmed: true,
          absence_reason: reason || 'Marcado por profesor',
          absence_confirmed_at: new Date().toISOString(),
        }, {
          onConflict: 'class_participant_id,scheduled_date'
        });

      if (confirmationError) {
        console.error('⚠️ [Trainer] Error upserting confirmation:', confirmationError);
        // Don't throw - class_participants was updated successfully
      }

      console.log('✅ [Trainer] Absence marked:', { participantId, scheduledDate });

      return updatedParticipant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
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
          confirmed_by_trainer: false,
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
      // Invalidate all today-attendance queries (including week views with different date ranges)
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
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

// Hook para eliminar clase completamente (attendance records, participants, y la clase)
export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ classId }: { classId: string }) => {
      console.log('🗑️ Deleting class completely:', { classId });

      if (!profile?.id) throw new Error('Usuario no autenticado');

      // 1. Eliminar registros de asistencia
      const { error: attendanceError } = await supabase
        .from('class_attendance_records')
        .delete()
        .eq('programmed_class_id', classId);

      if (attendanceError) {
        console.error('Error deleting attendance records:', attendanceError);
        throw attendanceError;
      }
      console.log('✅ Attendance records deleted');

      // 2. Eliminar participantes
      const { error: participantsError } = await supabase
        .from('class_participants')
        .delete()
        .eq('class_id', classId);

      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
        throw participantsError;
      }
      console.log('✅ Participants deleted');

      // 3. Eliminar registros de cancelación si existen
      const { error: cancelledError } = await supabase
        .from('cancelled_classes')
        .delete()
        .eq('programmed_class_id', classId);

      if (cancelledError) {
        console.error('Error deleting cancelled records:', cancelledError);
        // No lanzamos error aquí porque puede que no haya registros de cancelación
      }
      console.log('✅ Cancelled records deleted (if any)');

      // 4. Eliminar la clase programada
      const { error: classError } = await supabase
        .from('programmed_classes')
        .delete()
        .eq('id', classId);

      if (classError) {
        console.error('Error deleting class:', classError);
        throw classError;
      }
      console.log('✅ Class deleted');

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['cancelled-classes'] });
      queryClient.invalidateQueries({ queryKey: ['programmed-classes'] });
      toast.success('✓ Clase eliminada correctamente');
    },
    onError: (error: any) => {
      console.error('Error deleting class:', error);
      toast.error('Error al eliminar la clase');
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
