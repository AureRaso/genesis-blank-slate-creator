import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

export interface TrainerClassParticipant {
  id: string;
  student_enrollment_id: string;
  status: string;
  student_enrollment: {
    full_name: string;
    email: string;
  };
}

export interface TrainerWeeklySlot {
  id: string;
  name: string;
  days_of_week: string[];
  start_time: string;
  duration_minutes: number;
  court_number: number | null;
  club_id: string;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  is_active: boolean;
  club?: {
    name: string;
  };
  participants: TrainerClassParticipant[];
}

const DAY_NAME_FROM_INDEX: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

/**
 * Fetch a trainer's programmed classes for the weekly schedule.
 * Uses trainer.profile_id to match programmed_classes.trainer_profile_id.
 */
export const useTrainerWeeklySlots = (trainerProfileId: string, weekDate: Date) => {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['trainer-weekly-slots', trainerProfileId, weekStartStr],
    queryFn: async (): Promise<TrainerWeeklySlot[]> => {
      if (!trainerProfileId) return [];

      const { data, error } = await supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          days_of_week,
          start_time,
          duration_minutes,
          court_number,
          club_id,
          start_date,
          end_date,
          max_participants,
          is_active,
          club:clubs!club_id(name),
          participants:class_participants(
            id,
            student_enrollment_id,
            status,
            student_enrollment:student_enrollments!student_enrollment_id(
              full_name,
              email
            )
          )
        `)
        .eq('trainer_profile_id', trainerProfileId)
        .eq('is_active', true)
        .lte('start_date', weekEndStr)
        .gte('end_date', weekStartStr)
        .order('start_time');

      if (error) throw error;
      return (data || []) as TrainerWeeklySlot[];
    },
    enabled: !!trainerProfileId,
  });
};

/**
 * Get the days of the week for a given date, formatted for display.
 */
export const getWeekDays = (weekDate: Date) => {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((day) => ({
    date: day,
    dayName: DAY_NAME_FROM_INDEX[day.getDay()],
    shortLabel: format(day, 'EEE d', { locale: es }).toUpperCase(),
    fullLabel: format(day, 'EEEE d MMM', { locale: es }),
    dayNumber: day.getDate(),
    isToday: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
  }));
};

/**
 * Expand programmed_classes (which have days_of_week arrays) into
 * per-day-and-time entries for the grid.
 */
export interface ExpandedSlot {
  classId: string;
  className: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  courtNumber: number | null;
  clubName: string;
  maxParticipants: number | null;
  participants: TrainerClassParticipant[];
}

export const expandSlotsForGrid = (slots: TrainerWeeklySlot[]): ExpandedSlot[] => {
  const expanded: ExpandedSlot[] = [];

  for (const slot of slots) {
    for (const day of slot.days_of_week) {
      // Normalize day name (remove accents)
      const normalizedDay = day.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      expanded.push({
        classId: slot.id,
        className: slot.name,
        dayOfWeek: normalizedDay,
        startTime: slot.start_time.slice(0, 5),
        durationMinutes: slot.duration_minutes,
        courtNumber: slot.court_number,
        clubName: slot.club?.name || '',
        maxParticipants: slot.max_participants,
        participants: slot.participants || [],
      });
    }
  }

  return expanded;
};

/**
 * Get unique time slots from expanded slots, sorted.
 */
export const getTimeSlots = (expanded: ExpandedSlot[]): string[] => {
  const times = new Set<string>();
  expanded.forEach((slot) => times.add(slot.startTime));
  return Array.from(times).sort();
};

/**
 * Find the expanded slot for a given day and time.
 */
export const getSlotForDayAndTime = (
  expanded: ExpandedSlot[],
  dayName: string,
  time: string
): ExpandedSlot | undefined => {
  return expanded.find(
    (s) => s.dayOfWeek === dayName && s.startTime === time
  );
};
