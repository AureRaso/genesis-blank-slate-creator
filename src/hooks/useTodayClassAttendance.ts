import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TodayClassAttendance {
  id: string;
  class_id: string;
  attendance_confirmed_for_date: string | null;
  attendance_confirmed_at: string | null;
  absence_confirmed: boolean | null;
  absence_reason: string | null;
  absence_confirmed_at: string | null;
  absence_locked: boolean | null; // Si la ausencia está bloqueada por notificación WhatsApp
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

  return useQuery({
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
        .select('id, class_id, student_enrollment_id, status, attendance_confirmed_for_date, attendance_confirmed_at, absence_confirmed, absence_reason, absence_confirmed_at, absence_locked')
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
          club_id
        `)
        .in('id', classIds);

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
            // Add the class with the specific date information
            upcomingClasses.push({
              ...participation,
              scheduled_date: dateStr,
              day_name: dayName
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
