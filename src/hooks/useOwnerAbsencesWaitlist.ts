/**
 * useOwnerAbsencesWaitlist
 *
 * Hook para obtener ausencias y listas de espera de todos los clubes
 * para los próximos 10 días. Solo para rol owner.
 *
 * OPTIMIZADO: Reduce el número de consultas agrupando datos.
 * USA MISMA LÓGICA que useClassesWithAbsences para detectar ausencias.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

// Tipos
export interface AbsenceInfo {
  participantId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  absenceReason?: string;
}

export interface WaitlistInfo {
  id: string;
  studentName: string;
  studentEmail: string;
  studentLevel?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  requestedAt: string;
}

export interface ClassWithAbsencesAndWaitlist {
  classId: string;
  className: string;
  startTime: string;
  maxParticipants: number;
  trainerName?: string;
  absences: AbsenceInfo[];
  waitlist: WaitlistInfo[];
  totalParticipants: number;
}

export interface ClubDayData {
  clubId: string;
  clubName: string;
  classes: ClassWithAbsencesAndWaitlist[];
}

export interface DayData {
  date: string;
  dateFormatted: string;
  dayName: string;
  clubs: ClubDayData[];
  totalAbsences: number;
  totalWaitlistPending: number;
}

// Mapeo de días de la semana
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

export const useOwnerAbsencesWaitlist = (daysAhead: number = 10, selectedClubId?: string) => {
  return useQuery({
    queryKey: ['owner-absences-waitlist', daysAhead, selectedClubId],
    queryFn: async (): Promise<DayData[]> => {
      console.log('[OwnerAbsences] Starting query...', { daysAhead, selectedClubId });

      const today = startOfDay(new Date());
      const endDate = addDays(today, daysAhead - 1);
      const todayStr = format(today, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // 1. Obtener clubes
      let clubsQuery = supabase
        .from('clubs')
        .select('id, name')
        .order('name');

      if (selectedClubId) {
        clubsQuery = clubsQuery.eq('id', selectedClubId);
      }

      const { data: clubs, error: clubsError } = await clubsQuery;
      console.log('[OwnerAbsences] Clubs fetched:', clubs?.length, clubsError);

      if (clubsError) {
        console.error('[OwnerAbsences] Error fetching clubs:', clubsError);
        throw clubsError;
      }

      if (!clubs || clubs.length === 0) {
        console.log('[OwnerAbsences] No clubs found');
        return [];
      }

      const clubIds = clubs.map(c => c.id);

      // 2. Obtener TODAS las clases activas de los clubes seleccionados
      let classesQuery = supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          max_participants,
          days_of_week,
          club_id,
          trainer:profiles!trainer_profile_id(full_name)
        `)
        .eq('is_active', true)
        .lte('start_date', endDateStr)
        .gte('end_date', todayStr);

      if (selectedClubId) {
        classesQuery = classesQuery.eq('club_id', selectedClubId);
      } else {
        classesQuery = classesQuery.in('club_id', clubIds);
      }

      const { data: allClasses, error: classesError } = await classesQuery;
      console.log('[OwnerAbsences] Classes fetched:', allClasses?.length, classesError);

      if (classesError) {
        console.error('[OwnerAbsences] Error fetching classes:', classesError);
        throw classesError;
      }

      if (!allClasses || allClasses.length === 0) {
        console.log('[OwnerAbsences] No classes found, returning empty days');
        const results: DayData[] = [];
        for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
          const currentDate = addDays(today, dayOffset);
          results.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            dateFormatted: format(currentDate, "EEEE d 'de' MMMM", { locale: es }),
            dayName: getDayOfWeekInSpanish(currentDate),
            clubs: [],
            totalAbsences: 0,
            totalWaitlistPending: 0
          });
        }
        return results;
      }

      const classIds = allClasses.map(c => c.id);

      // 3. Obtener TODOS los participantes de esas clases (incluyendo absence_confirmed del participante)
      const { data: allParticipants, error: participantsError } = await supabase
        .from('class_participants')
        .select(`
          id,
          class_id,
          absence_confirmed,
          absence_reason,
          student_enrollment:student_enrollments(
            full_name,
            email,
            phone
          )
        `)
        .in('class_id', classIds)
        .eq('status', 'active');

      console.log('[OwnerAbsences] Participants fetched:', allParticipants?.length, participantsError);

      if (participantsError) {
        console.error('[OwnerAbsences] Error fetching participants:', participantsError);
      }

      const participantIds = allParticipants?.map(p => p.id) || [];

      // 4. Obtener TODAS las confirmaciones de ausencia en el rango de fechas
      // (de la tabla class_attendance_confirmations)
      let allConfirmations: any[] = [];
      if (participantIds.length > 0) {
        const { data: confirmations, error: confirmationsError } = await supabase
          .from('class_attendance_confirmations')
          .select(`
            class_participant_id,
            scheduled_date,
            absence_confirmed,
            absence_reason
          `)
          .in('class_participant_id', participantIds)
          .gte('scheduled_date', todayStr)
          .lte('scheduled_date', endDateStr);

        console.log('[OwnerAbsences] Confirmations fetched:', confirmations?.length, confirmationsError);

        if (!confirmationsError && confirmations) {
          allConfirmations = confirmations;
        }
      }

      // 5. Obtener TODAS las entradas de waitlist en el rango de fechas
      const { data: allWaitlist, error: waitlistError } = await supabase
        .from('class_waitlist')
        .select(`
          id,
          class_id,
          class_date,
          status,
          requested_at,
          student_enrollment:student_enrollments(
            full_name,
            email,
            level
          )
        `)
        .in('class_id', classIds)
        .gte('class_date', todayStr)
        .lte('class_date', endDateStr);

      console.log('[OwnerAbsences] Waitlist fetched:', allWaitlist?.length, waitlistError);

      // 6. Organizar los datos por día
      const results: DayData[] = [];

      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const currentDate = addDays(today, dayOffset);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayName = getDayOfWeekInSpanish(currentDate);
        const dateFormatted = format(currentDate, "EEEE d 'de' MMMM", { locale: es });

        const clubsData: ClubDayData[] = [];
        let dayTotalAbsences = 0;
        let dayTotalWaitlistPending = 0;

        // Filtrar clases que tienen este día de la semana
        const dayClasses = allClasses.filter(c => {
          const classDays = c.days_of_week || [];
          return classDays.includes(dayName);
        });

        // Agrupar por club
        for (const club of clubs) {
          const clubClasses = dayClasses.filter(c => c.club_id === club.id);

          if (clubClasses.length === 0) continue;

          const classesWithData: ClassWithAbsencesAndWaitlist[] = [];

          for (const classData of clubClasses) {
            // Participantes de esta clase
            const classParticipants = allParticipants?.filter(p => p.class_id === classData.id) || [];

            // LÓGICA DE AUSENCIAS (igual que useClassesWithAbsences):
            // 1. Buscar en class_attendance_confirmations para la fecha específica
            // 2. Si no hay registro, usar el valor de class_participants.absence_confirmed
            const absences: AbsenceInfo[] = [];

            for (const participant of classParticipants) {
              // Buscar confirmación específica para esta fecha
              const confirmation = allConfirmations.find(c =>
                c.class_participant_id === participant.id &&
                c.scheduled_date === dateStr
              );

              // Determinar si está ausente usando fallback pattern
              const isAbsent = confirmation
                ? confirmation.absence_confirmed === true
                : (participant.absence_confirmed === true);

              const absenceReason = confirmation
                ? confirmation.absence_reason
                : participant.absence_reason;

              if (isAbsent) {
                const enrollment = participant.student_enrollment as any;
                absences.push({
                  participantId: participant.id,
                  studentName: enrollment?.full_name || 'Desconocido',
                  studentEmail: enrollment?.email || '',
                  studentPhone: enrollment?.phone,
                  absenceReason: absenceReason || undefined
                });
              }
            }

            // Waitlist para esta clase y fecha
            const classWaitlist = allWaitlist?.filter(w =>
              w.class_id === classData.id &&
              w.class_date === dateStr
            ) || [];

            const waitlist: WaitlistInfo[] = classWaitlist.map(entry => {
              const enrollment = entry.student_enrollment as any;
              return {
                id: entry.id,
                studentName: enrollment?.full_name || 'Desconocido',
                studentEmail: enrollment?.email || '',
                studentLevel: enrollment?.level,
                status: entry.status as WaitlistInfo['status'],
                requestedAt: entry.requested_at
              };
            });

            const pendingWaitlist = waitlist.filter(w => w.status === 'pending').length;

            // Solo incluir clases con ausencias O waitlist
            if (absences.length > 0 || waitlist.length > 0) {
              classesWithData.push({
                classId: classData.id,
                className: classData.name,
                startTime: classData.start_time,
                maxParticipants: classData.max_participants || 8,
                trainerName: (classData.trainer as any)?.full_name,
                absences,
                waitlist,
                totalParticipants: classParticipants.length
              });

              dayTotalAbsences += absences.length;
              dayTotalWaitlistPending += pendingWaitlist;
            }
          }

          if (classesWithData.length > 0) {
            clubsData.push({
              clubId: club.id,
              clubName: club.name,
              classes: classesWithData
            });
          }
        }

        results.push({
          date: dateStr,
          dateFormatted,
          dayName,
          clubs: clubsData,
          totalAbsences: dayTotalAbsences,
          totalWaitlistPending: dayTotalWaitlistPending
        });
      }

      console.log('[OwnerAbsences] Query complete. Total absences found:',
        results.reduce((sum, d) => sum + d.totalAbsences, 0));
      console.log('[OwnerAbsences] Days with data:',
        results.filter(d => d.clubs.length > 0).length);

      return results;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

// Hook para obtener resumen de todos los clubes (para el filtro)
export const useClubsForFilter = () => {
  return useQuery({
    queryKey: ['clubs-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};
