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

// Hook para obtener las clases del día actual del jugador
export const useTodayClassAttendance = () => {
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const todayDayName = getDayOfWeekInSpanish(new Date());

  return useQuery({
    queryKey: ['today-class-attendance', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('🔍 DEBUG - useTodayClassAttendance:', {
        profileId: profile.id,
        profileEmail: profile.email,
        profileFullName: profile.full_name,
        today,
        todayDayName
      });

      // STEP 1: Get class participants using student_enrollments email match
      console.log('📍 STEP 1: Fetching class participants...');

      // Get enrollments that match this user's email
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, email, full_name')
        .eq('email', profile.email);

      console.log('📊 Enrollments found by email:', { enrollments, enrollmentError, searchEmail: profile.email });

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
        .select('id, class_id, student_enrollment_id, status, attendance_confirmed_for_date, attendance_confirmed_at, absence_confirmed, absence_reason, absence_confirmed_at')
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

        return {
          id: participant.id,
          class_id: participant.class_id,
          attendance_confirmed_for_date: participant.attendance_confirmed_for_date,
          attendance_confirmed_at: participant.attendance_confirmed_at,
          absence_confirmed: participant.absence_confirmed,
          absence_reason: participant.absence_reason,
          absence_confirmed_at: participant.absence_confirmed_at,
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

      // Filter classes that are scheduled for today
      const todayClasses = data?.filter((participation: any) => {
        const programmedClass = participation.programmed_class;
        if (!programmedClass) return false;

        console.log('🔍 DEBUG - Checking class:', {
          className: programmedClass.name,
          daysOfWeek: programmedClass.days_of_week,
          todayDayName,
          includes: programmedClass.days_of_week?.includes(todayDayName),
          startDate: programmedClass.start_date,
          endDate: programmedClass.end_date
        });

        // Check if today is within the class date range
        const startDate = new Date(programmedClass.start_date);
        const endDate = new Date(programmedClass.end_date);
        const currentDate = new Date();

        if (currentDate < startDate || currentDate > endDate) {
          console.log('❌ Class date out of range');
          return false;
        }

        // Check if today's day of week is in the class schedule
        const isToday = programmedClass.days_of_week?.includes(todayDayName);
        console.log('✅ Is today?', isToday);
        return isToday;
      }) || [];

      console.log('🔍 DEBUG - Final today classes:', todayClasses);
      return todayClasses as TodayClassAttendance[];
    },
    enabled: !!profile?.id,
  });
};

// Hook para confirmar asistencia
export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async (participantId: string) => {
      const { data, error } = await supabase
        .from('class_participants')
        .update({
          attendance_confirmed_for_date: today,
          attendance_confirmed_at: new Date().toISOString(),
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-class-attendance', profile?.id, today] });
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
      queryClient.invalidateQueries({ queryKey: ['today-class-attendance', profile?.id, today] });
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
      queryClient.invalidateQueries({ queryKey: ['today-class-attendance', profile?.id, today] });
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
      queryClient.invalidateQueries({ queryKey: ['today-class-attendance', profile?.id, today] });
      toast.success('Confirmación de ausencia cancelada');
    },
    onError: (error: any) => {
      console.error('Error canceling absence confirmation:', error);
      toast.error('Error al cancelar confirmación de ausencia');
    },
  });
};
