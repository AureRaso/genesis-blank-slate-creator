import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClassWithAbsences {
  id: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
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

export const useClassesWithAbsences = (clubId?: string) => {
  return useQuery({
    queryKey: ['classes-with-absences', clubId, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!clubId) return [];

      const today = format(new Date(), 'yyyy-MM-dd');
      const todayDayName = getDayOfWeekInSpanish(new Date(today));

      console.log('🔍 [useClassesWithAbsences] Fetching classes for:', { clubId, today, todayDayName });

      // Get all active classes for this club
      const { data: classes, error: classesError } = await supabase
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
          )
        `)
        .eq('club_id', clubId)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today);

      if (classesError) {
        console.error('❌ [useClassesWithAbsences] Error fetching classes:', classesError);
        throw classesError;
      }

      console.log('📊 [useClassesWithAbsences] Raw classes fetched:', classes?.length || 0);

      if (!classes || classes.length === 0) {
        console.log('⚠️ [useClassesWithAbsences] No classes found');
        return [];
      }

      // Filter classes that match today's day of week
      const todayClasses = classes.filter((classData: any) => {
        const classDays = classData.days_of_week || [];
        const matches = classDays.includes(todayDayName);
        if (matches) {
          console.log('✅ [useClassesWithAbsences] Class matches today:', {
            name: classData.name,
            days_of_week: classDays,
            todayDayName
          });
        }
        return matches;
      });

      console.log('📅 [useClassesWithAbsences] Classes for today:', todayClasses.length);

      if (todayClasses.length === 0) {
        console.log('⚠️ [useClassesWithAbsences] No classes match today');
        return [];
      }

      // Get participants for all these classes with absence info
      const classIds = todayClasses.map(c => c.id);
      const { data: participants, error: participantsError } = await supabase
        .from('class_participants')
        .select(`
          id,
          class_id,
          student_enrollment_id,
          status,
          absence_confirmed,
          absence_locked,
          is_substitute,
          student_enrollment:student_enrollments(
            full_name,
            email,
            phone
          )
        `)
        .in('class_id', classIds)
        .eq('status', 'active');

      if (participantsError) {
        console.error('❌ [useClassesWithAbsences] Error fetching participants:', participantsError);
        throw participantsError;
      }

      console.log('👥 [useClassesWithAbsences] Participants fetched:', participants?.length || 0);

      // Group participants by class and filter classes with absences
      const classesWithParticipants: ClassWithAbsences[] = todayClasses
        .map((classData: any) => {
          const classParticipants = participants?.filter(p => p.class_id === classData.id) || [];
          const absenceCount = classParticipants.filter(p => p.absence_confirmed).length;

          return {
            id: classData.id,
            name: classData.name,
            start_time: classData.start_time,
            duration_minutes: classData.duration_minutes,
            max_participants: classData.max_participants,
            trainer: classData.trainer,
            participants: classParticipants,
            absenceCount,
            totalParticipants: classData.max_participants || 8
          };
        })
        .filter(c => c.absenceCount > 0); // Only classes with at least one absence

      console.log('🎯 [useClassesWithAbsences] Classes with absences:', classesWithParticipants.length);
      classesWithParticipants.forEach(c => {
        console.log(`  - ${c.name}: ${c.absenceCount} ausencias de ${c.totalParticipants} alumnos`);
      });

      return classesWithParticipants;
    },
    enabled: !!clubId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
