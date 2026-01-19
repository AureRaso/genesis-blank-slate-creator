import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClassWithAbsences {
  id: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  club_language?: string;
  trainer?: {
    id: string;
    full_name: string;
  };
  participants: {
    id: string;
    student_enrollment_id: string;
    status: string;
    absence_confirmed: boolean;
    absence_locked: boolean;
    is_substitute: boolean;
    student_enrollment?: {
      full_name: string;
      email: string;
      phone?: string;
    };
  }[];
  absenceCount: number;
  totalParticipants: number;
}

// Get day of week in Spanish format used in database
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

export const useClassesWithAbsences = (clubId?: string, clubIds?: string[]) => {
  return useQuery({
    queryKey: ['classes-with-absences', clubId, clubIds, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      // Determine which club IDs to query
      const targetClubIds = clubIds && clubIds.length > 0 ? clubIds : (clubId ? [clubId] : []);

      if (targetClubIds.length === 0) return [];

      const today = format(new Date(), 'yyyy-MM-dd');
      const todayDayName = getDayOfWeekInSpanish(new Date(today));

      // Get all active classes for the club(s)
      let query = supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          duration_minutes,
          max_participants,
          days_of_week,
          start_date,
          end_date,
          trainer:profiles!trainer_profile_id(
            id,
            full_name
          ),
          clubs:club_id(
            default_language
          )
        `)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today);

      // Filter by club(s)
      if (targetClubIds.length === 1) {
        query = query.eq('club_id', targetClubIds[0]);
      } else {
        query = query.in('club_id', targetClubIds);
      }

      const { data: classes, error: classesError } = await query;

      if (classesError) {
        throw classesError;
      }

      if (!classes || classes.length === 0) {
        return [];
      }

      // Filter classes that match today's day of week
      const todayClasses = classes.filter((classData: any) => {
        const classDays = classData.days_of_week || [];
        return classDays.includes(todayDayName);
      });

      if (todayClasses.length === 0) {
        return [];
      }

      // Get cancelled classes for today
      const todayClassIds = todayClasses.map(c => c.id);
      const { data: cancelledClasses, error: cancelledError } = await supabase
        .from('cancelled_classes')
        .select('programmed_class_id')
        .in('programmed_class_id', todayClassIds)
        .eq('cancelled_date', today);

      if (cancelledError) {
        console.error('Error fetching cancelled classes:', cancelledError);
        // Continue without filtering - don't break the whole query
      }

      // Filter out cancelled classes
      const cancelledIds = new Set(cancelledClasses?.map(c => c.programmed_class_id) || []);
      const todayClassesNotCancelled = todayClasses.filter(c => !cancelledIds.has(c.id));

      if (todayClassesNotCancelled.length === 0) {
        return [];
      }

      // Get participants for all these classes
      const classIds = todayClassesNotCancelled.map(c => c.id);
      const { data: participants, error: participantsError } = await supabase
        .from('class_participants')
        .select(`
          id,
          class_id,
          student_enrollment_id,
          status,
          is_substitute,
          absence_confirmed,
          absence_reason,
          absence_confirmed_at,
          absence_locked,
          attendance_confirmed_for_date,
          attendance_confirmed_at,
          confirmed_by_trainer,
          student_enrollment:student_enrollments(
            full_name,
            email,
            phone
          )
        `)
        .in('class_id', classIds)
        .eq('status', 'active');

      if (participantsError) {
        throw participantsError;
      }

      // Get attendance confirmations for today's date
      const participantIds = participants?.map(p => p.id) || [];
      const { data: attendanceConfirmations, error: confirmationsError } = await supabase
        .from('class_attendance_confirmations')
        .select('*')
        .in('class_participant_id', participantIds)
        .eq('scheduled_date', today);

      if (confirmationsError) {
        throw confirmationsError;
      }

      // Create a map of participant confirmations for quick lookup
      const confirmationsMap = new Map(
        attendanceConfirmations?.map(c => [c.class_participant_id, c]) || []
      );

      // Group participants by class and filter classes with absences
      const classesWithParticipants: ClassWithAbsences[] = todayClassesNotCancelled
        .map((classData: any) => {
          const classParticipants = (participants?.filter(p => p.class_id === classData.id) || [])
            .map(p => {
              const confirmation = confirmationsMap.get(p.id);

              // Determine absence status
              const isAbsent = confirmation
                ? confirmation.absence_confirmed
                : (p.absence_confirmed || false);

              // REGLA DE NEGOCIO: Si NO hay ausencia confirmada, entonces está implícitamente confirmado para asistir
              const implicitAttendanceConfirmed = !isAbsent;

              // FALLBACK PATTERN: use confirmation if exists, otherwise use class_participants data
              return {
                ...p,
                absence_confirmed: isAbsent,
                absence_locked: confirmation
                  ? confirmation.absence_locked
                  : (p.absence_locked || false),
                absence_reason: confirmation
                  ? confirmation.absence_reason
                  : p.absence_reason,
                absence_confirmed_at: confirmation
                  ? confirmation.absence_confirmed_at
                  : p.absence_confirmed_at,
                attendance_confirmed_for_date: confirmation
                  ? (confirmation.attendance_confirmed ? today : (implicitAttendanceConfirmed ? today : null))
                  : (p.attendance_confirmed_for_date || (implicitAttendanceConfirmed ? today : null)),
                attendance_confirmed_at: confirmation
                  ? confirmation.attendance_confirmed_at
                  : p.attendance_confirmed_at,
                confirmed_by_trainer: confirmation
                  ? confirmation.confirmed_by_trainer
                  : (p.confirmed_by_trainer || false),
              };
            });

          const absenceCount = classParticipants.filter(p => p.absence_confirmed).length;

          return {
            id: classData.id,
            name: classData.name,
            start_time: classData.start_time,
            duration_minutes: classData.duration_minutes,
            max_participants: classData.max_participants,
            club_language: classData.clubs?.default_language || 'es',
            trainer: classData.trainer,
            participants: classParticipants,
            absenceCount,
            totalParticipants: classData.max_participants || 8
          };
        })
        .filter(c => c.absenceCount > 0); // Only classes with at least one absence

      return classesWithParticipants;
    },
    enabled: !!clubId || (clubIds && clubIds.length > 0),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
