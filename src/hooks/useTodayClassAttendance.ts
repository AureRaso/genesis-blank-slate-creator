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

      console.log('🔍 DEBUG - useUpcomingClassAttendance:', {
        profileId: profile.id,
        profileEmail: profile.email,
        profileFullName: profile.full_name,
        isGuardian,
        todayStr,
        next10Days: next10Days.map(d => ({ date: d.dateStr, day: d.dayName }))
      });

      // STEP 1: Get profile IDs and emails to search for
      let emailsToSearch: string[] = [profile.email];
      let profileIdsToSearch: string[] = [profile.id];

      if (isGuardian) {
        console.log('🔍 User is guardian - fetching children...');
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
          console.error('❌ Error fetching children:', childrenError);
          throw childrenError;
        }

        if (children && children.length > 0) {
          const childrenData = children
            .map(c => (c.profiles as any))
            .filter(Boolean);

          profileIdsToSearch = childrenData.map((c: any) => c.id);
          emailsToSearch = childrenData.map((c: any) => c.email);

          console.log('✅ Guardian children IDs:', profileIdsToSearch);
          console.log('✅ Guardian children emails:', emailsToSearch);
        } else {
          console.log('ℹ️ Guardian has no children');
          return [];
        }
      }

      console.log('📧 Profile IDs to search:', profileIdsToSearch);
      console.log('📧 Emails to search:', emailsToSearch);

      // STEP 2: Get class participants using BOTH student_profile_id AND email
      console.log('📍 STEP 2: Fetching class participants...');

      // DEBUG: First, let's check ALL student_enrollments to see what exists
      console.log('🔍 DEBUG - Fetching ALL student_enrollments for inspection...');
      const { data: allEnrollments, error: allError } = await supabase
        .from('student_enrollments')
        .select('id, email, full_name, student_profile_id');

      console.log('📊 ALL student_enrollments in database:', {
        count: allEnrollments?.length || 0,
        enrollments: allEnrollments,
        error: allError
      });

      // DEBUG: Test query by student_profile_id ONLY
      console.log('🔍 DEBUG - Testing query by student_profile_id ONLY...');
      const { data: byProfileId, error: profileIdError } = await supabase
        .from('student_enrollments')
        .select('id, email, full_name, student_profile_id')
        .in('student_profile_id', profileIdsToSearch);

      console.log('📊 Query by student_profile_id result:', {
        searchIds: profileIdsToSearch,
        count: byProfileId?.length || 0,
        enrollments: byProfileId,
        error: profileIdError
      });

      // DEBUG: Test query by email ONLY
      console.log('🔍 DEBUG - Testing query by email ONLY...');
      const { data: byEmail, error: emailError } = await supabase
        .from('student_enrollments')
        .select('id, email, full_name, student_profile_id')
        .in('email', emailsToSearch);

      console.log('📊 Query by email result:', {
        searchEmails: emailsToSearch,
        count: byEmail?.length || 0,
        enrollments: byEmail,
        error: emailError
      });

      // Now try the combined OR query with detailed logging
      const orQueryString = `student_profile_id.in.(${profileIdsToSearch.join(',')}),email.in.(${emailsToSearch.map(e => `"${e}"`).join(',')})`;
      console.log('🔍 DEBUG - OR query string:', orQueryString);

      // Get enrollments that match either student_profile_id OR email
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, email, full_name, student_profile_id')
        .or(orQueryString);

      console.log('📊 Enrollments found:', {
        enrollments,
        enrollmentError,
        searchProfileIds: profileIdsToSearch,
        searchEmails: emailsToSearch,
        foundCount: enrollments?.length || 0
      });

      if (enrollmentError) {
        console.error('❌ Error fetching enrollments:', enrollmentError);
        throw enrollmentError;
      }

      if (!enrollments?.length) {
        console.log('❌ No enrollments found for this student email');
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);
      console.log('📊 Enrollment IDs:', enrollmentIds);

      const { data: participantsBasic, error: errorBasic } = await supabase
        .from('class_participants')
        .select('id, class_id, student_enrollment_id, status, attendance_confirmed_for_date, attendance_confirmed_at, confirmed_by_trainer, absence_confirmed, absence_reason, absence_confirmed_at, absence_locked')
        .in('student_enrollment_id', enrollmentIds)
        .eq('status', 'active');

      console.log('📊 STEP 1 Result:', { participantsBasic, errorBasic });

      if (errorBasic) {
        console.error('❌ STEP 1 ERROR:', errorBasic);
        throw errorBasic;
      }

      if (!participantsBasic?.length) {
        console.log('❌ No class participants found for this student');
        return [];
      }

      // STEP 2: Get programmed classes data separately
      console.log('📍 STEP 2: Fetching programmed classes...');
      const classIds = participantsBasic.map(p => p.class_id);
      console.log('📊 Class IDs to fetch:', classIds);

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

      console.log('📊 STEP 2 Result:', {
        programmedClasses,
        errorClasses,
        requestedIds: classIds.length,
        foundClasses: programmedClasses?.length
      });

      if (errorClasses) {
        console.error('❌ STEP 2 ERROR:', errorClasses);
        throw errorClasses;
      }

      // STEP 3: Get trainer and club data
      console.log('📍 STEP 3: Fetching trainers and clubs...');
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

      console.log('📊 STEP 3 Result:', {
        trainers: trainersResult.data,
        clubs: clubsResult.data,
        trainersError: trainersResult.error,
        clubsError: clubsResult.error
      });

      // STEP 4: Combine all data manually
      console.log('📍 STEP 4: Combining data...');
      const trainersMap = new Map(trainersResult.data?.map(t => [t.id, t]) || []);
      const clubsMap = new Map(clubsResult.data?.map(c => [c.id, c]) || []);
      const classesMap = new Map(programmedClasses?.map(c => [c.id, c]) || []);
      const enrollmentsMap = new Map(enrollments.map(e => [e.id, e]) || []);

      const data = participantsBasic.map(participant => {
        const programmedClass = classesMap.get(participant.class_id);
        if (!programmedClass) {
          console.warn('⚠️ Programmed class not found for participant:', {
            participantId: participant.id,
            classId: participant.class_id,
            availableClassIds: Array.from(classesMap.keys())
          });
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

      console.log('📊 STEP 4 Combined data:', data);

      const error = null;
      if (!data?.length) {
        console.log('❌ No class participants found');
        return [];
      }

      // STEP 5: Get cancelled classes
      console.log('📍 STEP 5: Fetching cancelled classes...');
      const cancelledDateStart = next10Days[0].dateStr;
      const cancelledDateEnd = next10Days[next10Days.length - 1].dateStr;

      const { data: cancelledClasses, error: cancelledError } = await supabase
        .from('cancelled_classes')
        .select('programmed_class_id, cancelled_date')
        .gte('cancelled_date', cancelledDateStart)
        .lte('cancelled_date', cancelledDateEnd);

      console.log('📊 STEP 5 Result:', {
        cancelledClasses,
        cancelledError,
        dateRange: `${cancelledDateStart} to ${cancelledDateEnd}`
      });

      // Create a Set for quick lookup of cancelled classes
      const cancelledSet = new Set(
        cancelledClasses?.map(c => `${c.programmed_class_id}-${c.cancelled_date}`) || []
      );

      // STEP 6: Get attendance confirmations for all participants and dates
      console.log('📍 STEP 6: Fetching attendance confirmations...');
      const participantIds = participantsBasic.map(p => p.id);
      const dateRange = next10Days.map(d => d.dateStr);

      const { data: attendanceConfirmations, error: attendanceError } = await supabase
        .from('class_attendance_confirmations')
        .select('*')
        .in('class_participant_id', participantIds)
        .in('scheduled_date', dateRange);

      console.log('📊 STEP 6 Result:', {
        attendanceConfirmations,
        attendanceError,
        participantCount: participantIds.length,
        dateCount: dateRange.length,
        confirmationsByParticipant: attendanceConfirmations?.reduce((acc: any, c: any) => {
          const key = c.class_participant_id;
          if (!acc[key]) acc[key] = [];
          acc[key].push({
            scheduled_date: c.scheduled_date,
            absence_confirmed: c.absence_confirmed,
            absence_reason: c.absence_reason,
            attendance_confirmed: c.attendance_confirmed
          });
          return acc;
        }, {}) || {}
      });

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
          console.log('🔍 DEBUG - Checking class for date:', {
            className: programmedClass.name,
            checkingDate: dateStr,
            checkingDay: dayName,
            daysOfWeek: programmedClass.days_of_week,
            includes: programmedClass.days_of_week?.includes(dayName),
            startDate: programmedClass.start_date,
            endDate: programmedClass.end_date
          });

          // Check if the date is within the class date range
          // Normalize all dates to midnight for accurate comparison
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);

          const startDate = new Date(programmedClass.start_date);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(programmedClass.end_date);
          endDate.setHours(0, 0, 0, 0);

          if (checkDate < startDate || checkDate > endDate) {
            console.log('❌ Class date out of range for', dateStr);
            return;
          }

          // Check if this day of week is in the class schedule
          if (programmedClass.days_of_week?.includes(dayName)) {
            console.log('✅ Class scheduled for', dateStr);
            // Check if this specific class on this date is cancelled
            const isCancelled = cancelledSet.has(`${programmedClass.id}-${dateStr}`);
            console.log('🔍 DEBUG - Checking if cancelled:', {
              classId: programmedClass.id,
              date: dateStr,
              key: `${programmedClass.id}-${dateStr}`,
              isCancelled
            });

            // Get attendance confirmation for this specific participant and date
            const confirmationKey = `${participation.id}-${dateStr}`;
            const confirmation = confirmationsMap.get(confirmationKey);

            console.log('🔍 [Player] DEBUG - Attendance confirmation:', {
              participantId: participation.id,
              date: dateStr,
              key: confirmationKey,
              hasConfirmation: !!confirmation,
              confirmation: confirmation ? {
                id: confirmation.id,
                absence_confirmed: confirmation.absence_confirmed,
                absence_reason: confirmation.absence_reason,
                absence_confirmed_at: confirmation.absence_confirmed_at,
                attendance_confirmed: confirmation.attendance_confirmed,
                confirmed_by_trainer: confirmation.confirmed_by_trainer,
                scheduled_date: confirmation.scheduled_date,
                class_participant_id: confirmation.class_participant_id
              } : null,
              participationAbsence: participation.absence_confirmed,
              participationAbsenceReason: participation.absence_reason,
              participationAbsenceAt: participation.absence_confirmed_at
            });

            // Add the class with the specific date information
            // Priority: use confirmation data if available, otherwise fallback to class_participants data

            // Determine absence status
            const isAbsent = confirmation
              ? confirmation.absence_confirmed
              : (participation.absence_confirmed || false);
            
            console.log('🔍 [Player] DEBUG - Final absence status:', {
              participantId: participation.id,
              date: dateStr,
              isAbsent,
              hasConfirmation: !!confirmation,
              confirmationAbsence: confirmation?.absence_confirmed,
              confirmationAbsenceReason: confirmation?.absence_reason,
              confirmationAbsenceAt: confirmation?.absence_confirmed_at,
              participationAbsence: participation.absence_confirmed,
              participationAbsenceReason: participation.absence_reason,
              participationAbsenceAt: participation.absence_confirmed_at,
              finalAbsenceReason: confirmation?.absence_reason || participation.absence_reason,
              finalAbsenceAt: confirmation?.absence_confirmed_at || participation.absence_confirmed_at
            });

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

      console.log('🔍 DEBUG - Final upcoming classes:', upcomingClasses);
      return upcomingClasses as TodayClassAttendance[];
    },
    enabled: !!profile?.id,
  });

  // Setup Realtime subscription for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    console.log('🔌 [Player] Setting up Realtime subscription for class_attendance_confirmations');

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
        (payload) => {
          console.log('🔔 [Player] Realtime update received from class_attendance_confirmations:', {
            eventType: payload.eventType,
            table: payload.table,
          });

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
        (payload) => {
          console.log('🔔 [Player] Realtime update received from class_participants:', {
            eventType: payload.eventType,
            table: payload.table,
          });

          // Invalidate and refetch ALL upcoming-class-attendance queries
          queryClient.invalidateQueries({
            queryKey: ['upcoming-class-attendance']
          });
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 [Player] Realtime subscription status:', status);
        if (err) {
          console.error('❌ [Player] Realtime subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Player] Realtime successfully connected');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 [Player] Cleaning up Realtime subscription');
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
      console.log('🟢 Confirming attendance for:', { participantId, scheduledDate });
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
      console.log('🟢 Attendance confirmed:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('✓ Asistencia confirmada correctamente');
    },
    onError: (error: any) => {
      console.error('Error confirming attendance:', error);
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
    onError: (error: any) => {
      console.error('Error canceling attendance confirmation:', error);
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
    mutationFn: async ({ participantId, reason }: { participantId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('class_participants')
        .update({
          absence_confirmed: true,
          absence_reason: reason || null,
          absence_confirmed_at: new Date().toISOString(),
          // Clear attendance confirmation if exists
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
      toast.success('Ausencia confirmada');
    },
    onError: (error: any) => {
      console.error('Error confirming absence:', error);
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
    mutationFn: async (participantId: string) => {
      // Primero verificamos si la ausencia está bloqueada
      const { data: participant, error: checkError } = await supabase
        .from('class_participants')
        .select('absence_locked')
        .eq('id', participantId)
        .single();

      if (checkError) throw checkError;

      if (participant?.absence_locked) {
        throw new Error('No puedes cambiar tu ausencia porque el profesor ya notificó tu plaza disponible al grupo de WhatsApp');
      }

      const { data, error } = await supabase
        .from('class_participants')
        .update({
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Confirmación de ausencia cancelada');
    },
    onError: (error: any) => {
      console.error('Error canceling absence confirmation:', error);
      toast.error(error.message || 'Error al cancelar confirmación de ausencia');
    },
  });
};
