import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eachDayOfInterval, getDay, format, parseISO, startOfMonth, endOfMonth, min, max, isBefore, addMinutes, parse } from "date-fns";

export type AttendanceStatus =
  | 'attended'
  | 'absent_early'
  | 'absent_late'
  | 'cancelled_academy'
  | 'substitute'
  | 'private_lesson';

export interface AttendanceHistoryEntry {
  id: string;
  type: 'group' | 'private';
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AttendanceStatus;
  studentCount: number;
  absenceReason?: string;
}

const DAY_MAP: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2,
  miercoles: 3, 'miércoles': 3,
  jueves: 4, viernes: 5,
  sabado: 6, 'sábado': 6,
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const start = new Date(2000, 0, 1, h, m);
  const end = addMinutes(start, durationMinutes);
  return format(end, 'HH:mm');
}

function expandClassDates(
  startDate: string,
  endDate: string,
  daysOfWeek: string[] | null,
  monthStart: Date,
  monthEnd: Date,
  participantCreatedAt: string,
  enrollmentCreatedAt: string
): string[] {
  // Single-date class
  if (startDate === endDate) {
    const d = parseISO(startDate);
    if (d >= monthStart && d <= monthEnd) {
      return [startDate];
    }
    return [];
  }

  // Recurring class
  const rangeStart = max([
    parseISO(startDate),
    monthStart,
    parseISO(participantCreatedAt.split('T')[0]),
  ]);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const rangeEnd = min([
    parseISO(endDate),
    monthEnd,
    today,
  ]);

  if (isBefore(rangeEnd, rangeStart)) return [];

  const targetDows = (daysOfWeek || [])
    .map(d => DAY_MAP[d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')])
    .filter(d => d !== undefined);

  return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    .filter(date => targetDows.includes(getDay(date)))
    .map(date => format(date, 'yyyy-MM-dd'));
}

function determineStatus(
  classDate: string,
  classStartTime: string,
  absenceConfirmed: boolean | null,
  absenceConfirmedAt: string | null,
  attendanceConfirmedForDate: string | null,
  isSubstitute: boolean | null,
  isCancelled: boolean,
  enrollmentCreatedAt: string
): AttendanceStatus {
  if (isCancelled) return 'cancelled_academy';
  if (isSubstitute) return 'substitute';

  if (absenceConfirmed) {
    if (absenceConfirmedAt && classStartTime) {
      const classDateTime = new Date(`${classDate}T${classStartTime}`);
      const confirmAt = new Date(absenceConfirmedAt);
      const hoursNotice = (classDateTime.getTime() - confirmAt.getTime()) / (1000 * 60 * 60);
      return hoursNotice < 5 ? 'absent_late' : 'absent_early';
    }
    return 'absent_early';
  }

  return 'attended';
}

export const useStudentAttendanceHistory = (
  studentEnrollmentId: string | undefined,
  year: number,
  month: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['student-attendance-history', studentEnrollmentId, year, month],
    queryFn: async (): Promise<AttendanceHistoryEntry[]> => {
      if (!studentEnrollmentId) return [];

      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

      // Get enrollment info (for created_at and profile_id for private lessons)
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('created_at, student_profile_id, email')
        .eq('id', studentEnrollmentId)
        .single();

      const enrollmentCreatedAt = enrollment?.created_at || '2000-01-01T00:00:00Z';

      // Fetch 3 data sources in parallel
      const [participantsResult, cancelledResult, privateLessonsResult] = await Promise.all([
        // 1. Class participants with class details and participant count
        supabase
          .from('class_participants')
          .select(`
            id,
            class_id,
            is_substitute,
            absence_confirmed,
            absence_confirmed_at,
            absence_reason,
            attendance_confirmed_for_date,
            created_at,
            programmed_classes!inner(
              id, name, start_date, end_date, start_time, duration_minutes,
              days_of_week, max_participants
            )
          `)
          .eq('student_enrollment_id', studentEnrollmentId),

        // 2. Cancelled classes for this student's classes
        supabase
          .from('class_participants')
          .select('class_id')
          .eq('student_enrollment_id', studentEnrollmentId)
          .then(async ({ data: classIds }) => {
            if (!classIds || classIds.length === 0) return { data: [], error: null };
            const ids = [...new Set(classIds.map(c => c.class_id))];
            return supabase
              .from('cancelled_classes')
              .select('programmed_class_id, cancelled_date')
              .in('programmed_class_id', ids)
              .gte('cancelled_date', monthStartStr)
              .lte('cancelled_date', monthEndStr);
          }),

        // 3. Private lessons (if student has a profile)
        (async () => {
          let profileId = enrollment?.student_profile_id;
          if (!profileId && enrollment?.email) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', enrollment.email)
              .single();
            profileId = profile?.id || null;
          }
          if (!profileId) return { data: [], error: null };
          return supabase
            .from('private_lesson_bookings')
            .select('id, lesson_date, start_time, end_time, num_companions, status')
            .eq('booked_by_profile_id', profileId)
            .eq('status', 'confirmed')
            .gte('lesson_date', monthStartStr)
            .lte('lesson_date', monthEndStr);
        })(),
      ]);

      const participants = participantsResult.data || [];
      const cancelledClasses = cancelledResult.data || [];
      const privateLessons = privateLessonsResult.data || [];

      // Build cancelled set for fast lookup
      const cancelledSet = new Set(
        cancelledClasses.map(c => `${c.programmed_class_id}_${c.cancelled_date}`)
      );

      // Get participant counts per class
      const classIds = [...new Set(participants.map(p => p.class_id))];
      let participantCounts: Record<string, number> = {};
      if (classIds.length > 0) {
        const { data: counts } = await supabase
          .from('class_participants')
          .select('class_id')
          .in('class_id', classIds)
          .eq('is_substitute', false)
          .then(({ data }) => {
            const countMap: Record<string, number> = {};
            (data || []).forEach(p => {
              countMap[p.class_id] = (countMap[p.class_id] || 0) + 1;
            });
            return { data: countMap };
          });
        participantCounts = counts || {};
      }

      const entries: AttendanceHistoryEntry[] = [];

      // Process group classes
      for (const participant of participants) {
        const pc = participant.programmed_classes as any;
        if (!pc) continue;

        const dates = expandClassDates(
          pc.start_date,
          pc.end_date,
          pc.days_of_week,
          monthStart,
          monthEnd,
          participant.created_at,
          enrollmentCreatedAt
        );

        for (const date of dates) {
          const today = format(new Date(), 'yyyy-MM-dd');
          if (date > today) continue; // Skip future dates

          const isCancelled = cancelledSet.has(`${pc.id}_${date}`);
          const endTime = calculateEndTime(pc.start_time || '00:00', pc.duration_minutes || 60);

          const status = determineStatus(
            date,
            pc.start_time || '00:00',
            participant.absence_confirmed,
            participant.absence_confirmed_at,
            participant.attendance_confirmed_for_date,
            participant.is_substitute,
            isCancelled,
            enrollmentCreatedAt
          );

          entries.push({
            id: `${participant.id}_${date}`,
            type: 'group',
            className: pc.name || 'Sin nombre',
            date,
            startTime: (pc.start_time || '00:00').substring(0, 5),
            endTime,
            status,
            studentCount: participantCounts[pc.id] || 0,
            absenceReason: participant.absence_reason || undefined,
          });
        }
      }

      // Process private lessons
      for (const lesson of privateLessons) {
        entries.push({
          id: `private_${lesson.id}`,
          type: 'private',
          className: 'Clase particular',
          date: lesson.lesson_date,
          startTime: (lesson.start_time || '00:00').substring(0, 5),
          endTime: (lesson.end_time || '01:00').substring(0, 5),
          status: 'private_lesson',
          studentCount: (lesson.num_companions || 0) + 1,
        });
      }

      // Sort by date descending (most recent first)
      entries.sort((a, b) => b.date.localeCompare(a.date));

      return entries;
    },
    enabled: enabled && !!studentEnrollmentId,
    staleTime: 2 * 60 * 1000,
  });
};
