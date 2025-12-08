import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

export interface TodayClassAttendance {
  id: string;
  class_id: string;
  attendance_confirmed_for_date: string | null;
  attendance_confirmed_at: string | null;
  confirmed_by_trainer: boolean | null;
  absence_confirmed: boolean | null;
  absence_reason: string | null;
  absence_confirmed_at: string | null;
  absence_locked: boolean | null; // Si la ausencia está bloqueada por notificación WhatsApp
  is_cancelled?: boolean; // Si la clase está cancelada para esa fecha específica
  programmed_class: {
    id: string;
    name: string;
    start_time: string;
    duration_minutes: number;
    days_of_week: string[];
    trainer?: {
      full_name: string;
    };
    club: {
      name: string;
    };
  };
}

// Get day of week in Spanish format used in database
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

// Hook para obtener las clases de los próximos 10 días del jugador (o hijos si es guardian)
export const useTodayClassAttendance = () => {
  const { profile, isGuardian } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Calculate next 10 days
  const next10Days = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return {
      dateStr: date.toISOString().split('T')[0],
      dayName: getDayOfWeekInSpanish(date),
      date: date
    };
  });

  const query = useQuery({
    queryKey: ['upcoming-class-attendance', profile?.id, todayStr, isGuardian],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      // STEP 1: Get profile IDs and emails to search for
      let emailsToSearch: string[] = [profile.email];
      let profileIdsToSearch: string[] = [profile.id];

      if (isGuardian) {
        // Get children's profile IDs and emails
        const { data: children, error: childrenError } = await supabase
          .from('account_dependents')
          .select(`
            dependent_profile_id,
            profiles!account_dependents_dependent_profile_id_fkey (
              id,
              email
            )
          `)
          .eq('guardian_profile_id', profile.id);

        if (childrenError) {
          throw childrenError;
        }

        if (children && children.length > 0) {
          const childrenData = children
            .map(c => (c.profiles as any))
            .filter(Boolean);

          profileIdsToSearch = childrenData.map((c: any) => c.id);
          emailsToSearch = childrenData.map((c: any) => c.email);
        } else {
          return [];
        }
      }

      // STEP 2: Get class participants using BOTH student_profile_id AND email
      const orQueryString = `student_profile_id.in.(${profileIdsToSearch.join(',')}),email.in.(${emailsToSearch.map(e => `"${e}"`).join(',')})`;

      // Get enrollments that match either student_profile_id OR email
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, email, full_name, student_profile_id')
        .or(orQueryString);

      if (enrollmentError) {
        throw enrollmentError;
      }

      if (!enrollments?.length) {
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);

      const { data: participantsBasic, error: errorBasic } = await supabase
        .from('class_participants')
        .select('id, class_id, student_enrollment_id, status, attendance_confirmed_for_date, attendance_confirmed_at, confirmed_by_trainer, absence_confirmed, absence_reason, absence_confirmed_at, absence_locked')
        .in('student_enrollment_id', enrollmentIds)
        .eq('status', 'active');

      if (errorBasic) {
        throw errorBasic;
      }

      if (!participantsBasic?.length) {
        return [];
      }

      // STEP 2: Get programmed classes data separately
      const classIds = participantsBasic.map(p => p.class_id);

      const { data: programmedClasses, error: errorClasses } = await supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          duration_minutes,
          days_of_week,
          start_date,
          end_date,
          trainer_profile_id,
          club_id,
          is_open
        `)
        .in('id', classIds)
        .eq('is_active', true);
        // NOTE: No filtramos por is_open aquí porque si el jugador está inscrito (class_participant),
        // debe ver la clase en "Mis Clases" sin importar si is_open es true o false

      if (errorClasses) {
        throw errorClasses;
      }

      // STEP 3: Get trainer and club data
      const trainerIds = programmedClasses?.map(c => c.trainer_profile_id).filter(Boolean) || [];
      const clubIds = programmedClasses?.map(c => c.club_id).filter(Boolean) || [];

      const [trainersResult, clubsResult] = await Promise.all([
        trainerIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', trainerIds)
          : { data: [], error: null },
        clubIds.length > 0
          ? supabase.from('clubs').select('id, name').in('id', clubIds)
          : { data: [], error: null }
      ]);

      // STEP 4: Combine all data manually
      const trainersMap = new Map(trainersResult.data?.map(t => [t.id, t]) || []);
      const clubsMap = new Map(clubsResult.data?.map(c => [c.id, c]) || []);
      const classesMap = new Map(programmedClasses?.map(c => [c.id, c]) || []);
      const enrollmentsMap = new Map(enrollments.map(e => [e.id, e]) || []);

      const data = participantsBasic.map(participant => {
        const programmedClass = classesMap.get(participant.class_id);
        if (!programmedClass) {
          return null;
        }

        const enrollment = enrollmentsMap.get(participant.student_enrollment_id);

        return {
          id: participant.id,
          class_id: participant.class_id,
          attendance_confirmed_for_date: participant.attendance_confirmed_for_date,
          attendance_confirmed_at: participant.attendance_confirmed_at,
          confirmed_by_trainer: participant.confirmed_by_trainer,
          absence_confirmed: participant.absence_confirmed,
          absence_reason: participant.absence_reason,
          absence_confirmed_at: participant.absence_confirmed_at,
          absence_locked: participant.absence_locked, // Agregamos el campo de bloqueo
          student_enrollment: enrollment ? {
            id: enrollment.id,
            student_profile_id: enrollment.student_profile_id,
            full_name: enrollment.full_name,
            email: enrollment.email
          } : undefined,
          programmed_class: {
            id: programmedClass.id,
            name: programmedClass.name,
            start_time: programmedClass.start_time,
            duration_minutes: programmedClass.duration_minutes,
            days_of_week: programmedClass.days_of_week,
            start_date: programmedClass.start_date,
            end_date: programmedClass.end_date,
            trainer: programmedClass.trainer_profile_id
              ? trainersMap.get(programmedClass.trainer_profile_id)
              : undefined,
            club: programmedClass.club_id
              ? clubsMap.get(programmedClass.club_id)
              : { name: 'Unknown' }
          }
        };
      }).filter(Boolean);

      if (!data?.length) {
        return [];
      }

      // STEP 5: Get cancelled classes
      const cancelledDateStart = next10Days[0].dateStr;
      const cancelledDateEnd = next10Days[next10Days.length - 1].dateStr;

      const { data: cancelledClasses } = await supabase
        .from('cancelled_classes')
        .select('programmed_class_id, cancelled_date')
        .gte('cancelled_date', cancelledDateStart)
        .lte('cancelled_date', cancelledDateEnd);

      // Create a Set for quick lookup of cancelled classes
      const cancelledSet = new Set(
        cancelledClasses?.map(c => `${c.programmed_class_id}-${c.cancelled_date}`) || []
      );

      // STEP 6: Get attendance confirmations for all participants and dates
      const participantIds = participantsBasic.map(p => p.id);
      const dateRange = next10Days.map(d => d.dateStr);

      const { data: attendanceConfirmations } = await supabase
        .from('class_attendance_confirmations')
        .select('*')
        .in('class_participant_id', participantIds)
        .in('scheduled_date', dateRange);

      // Create a Map for quick lookup: participantId-date -> confirmation data
      const confirmationsMap = new Map(
        attendanceConfirmations?.map(c =>
          [`${c.class_participant_id}-${c.scheduled_date}`, c]
        ) || []
      );

      // Filter classes that are scheduled in the next 10 days
      const upcomingClasses: any[] = [];

      data?.forEach((participation: any) => {
        const programmedClass = participation.programmed_class;
        if (!programmedClass) return;

        // Check each of the next 10 days
        next10Days.forEach(({ dateStr, dayName, date }) => {
          // Check if the date is within the class date range
          // Normalize all dates to midnight for accurate comparison
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);

          const startDate = new Date(programmedClass.start_date);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(programmedClass.end_date);
          endDate.setHours(0, 0, 0, 0);

          if (checkDate < startDate || checkDate > endDate) {
            return;
          }

          // Check if this day of week is in the class schedule
          if (programmedClass.days_of_week?.includes(dayName)) {
            // Check if this specific class on this date is cancelled
            const isCancelled = cancelledSet.has(`${programmedClass.id}-${dateStr}`);

            // Get attendance confirmation for this specific participant and date
            const confirmationKey = `${participation.id}-${dateStr}`;
            const confirmation = confirmationsMap.get(confirmationKey);

            // Priority: use confirmation data if available, otherwise fallback to class_participants data
            // Determine absence status
            const isAbsent = confirmation
              ? confirmation.absence_confirmed
              : (participation.absence_confirmed || false);

            // REGLA DE NEGOCIO: Si NO hay ausencia confirmada, entonces está implícitamente confirmado para asistir
            // Esto significa que cuando se añade un alumno a una clase, por defecto se asume que va a ir
            const implicitAttendanceConfirmed = !isAbsent;

            upcomingClasses.push({
              ...participation,
              scheduled_date: dateStr,
              day_name: dayName,
              is_cancelled: isCancelled,
              // Si hay confirmación explícita de asistencia, usarla; si no, usar confirmación implícita
              attendance_confirmed_for_date: confirmation
                ? (confirmation.attendance_confirmed ? dateStr : (implicitAttendanceConfirmed ? dateStr : null))
                : (participation.attendance_confirmed_for_date || (implicitAttendanceConfirmed ? dateStr : null)),
              attendance_confirmed_at: confirmation
                ? confirmation.attendance_confirmed_at
                : participation.attendance_confirmed_at,
              confirmed_by_trainer: confirmation
                ? confirmation.confirmed_by_trainer
                : (participation.confirmed_by_trainer || false),
              absence_confirmed: isAbsent,
              absence_reason: confirmation
                ? confirmation.absence_reason
                : participation.absence_reason,
              absence_confirmed_at: confirmation
                ? confirmation.absence_confirmed_at
                : participation.absence_confirmed_at,
              absence_locked: confirmation
                ? confirmation.absence_locked
                : (participation.absence_locked || false),
            });
          }
        });
      });

      // Sort by date
      upcomingClasses.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

      return upcomingClasses as TodayClassAttendance[];
    },
    enabled: !!profile?.id,
  });

  // Setup Realtime subscription for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to changes in class_attendance_confirmations table
    const channel = supabase
      .channel('player-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'class_attendance_confirmations',
        },
        () => {
          // Invalidate and refetch ALL upcoming-class-attendance queries
          queryClient.invalidateQueries({
            queryKey: ['upcoming-class-attendance']
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'class_participants',
        },
        () => {
          // Invalidate and refetch ALL upcoming-class-attendance queries
          queryClient.invalidateQueries({
            queryKey: ['upcoming-class-attendance']
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  return query;
};

// Hook para confirmar asistencia
export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ participantId, scheduledDate }: { participantId: string; scheduledDate: string }) => {
      const { data, error } = await supabase
        .from('class_participants')
        .update({
          attendance_confirmed_for_date: scheduledDate,
          attendance_confirmed_at: new Date().toISOString(),
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('✓ Asistencia confirmada correctamente');
    },
    onError: () => {
      toast.error('Error al confirmar asistencia');
    },
  });
};

// Hook para cancelar confirmación de asistencia
export const useCancelAttendanceConfirmation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async (participantId: string) => {
      const { data, error } = await supabase
        .from('class_participants')
        .update({
          attendance_confirmed_for_date: null,
          attendance_confirmed_at: null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Confirmación de asistencia cancelada');
    },
    onError: () => {
      toast.error('Error al cancelar confirmación');
    },
  });
};

// Hook para confirmar ausencia (no asistencia)
export const useConfirmAbsence = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({ participantId, scheduledDate, reason }: { participantId: string; scheduledDate: string; reason?: string }) => {
      // Use class_attendance_confirmations for date-specific absence tracking
      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .upsert({
          class_participant_id: participantId,
          scheduled_date: scheduledDate,
          absence_confirmed: true,
          absence_reason: reason || null,
          absence_confirmed_at: new Date().toISOString(),
          // Clear attendance confirmation if exists
          attendance_confirmed: false,
          attendance_confirmed_at: null,
          confirmed_by_trainer: false,
        }, {
          onConflict: 'class_participant_id,scheduled_date'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Ausencia confirmada');
    },
    onError: () => {
      toast.error('Error al confirmar ausencia');
    },
  });
};

// Hook para cancelar confirmación de ausencia
export const useCancelAbsenceConfirmation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async ({ participantId, scheduledDate }: { participantId: string; scheduledDate: string }) => {
      // Check if absence is locked in class_attendance_confirmations
      const { data: confirmation, error: checkError } = await supabase
        .from('class_attendance_confirmations')
        .select('absence_locked')
        .eq('class_participant_id', participantId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (confirmation?.absence_locked) {
        throw new Error('No puedes cambiar tu ausencia porque el profesor ya notificó tu plaza disponible al grupo de WhatsApp');
      }

      // Use class_attendance_confirmations for date-specific tracking
      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .upsert({
          class_participant_id: participantId,
          scheduled_date: scheduledDate,
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        }, {
          onConflict: 'class_participant_id,scheduled_date'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Confirmación de ausencia cancelada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cancelar confirmación de ausencia');
    },
  });
};
