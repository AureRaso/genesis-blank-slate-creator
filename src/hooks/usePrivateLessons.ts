import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { eachDayOfInterval, format, getDay } from "date-fns";

// ============================================================================
// Types
// ============================================================================

export interface PrivateLessonAvailability {
  id: string;
  trainer_profile_id: string;
  club_id: string;
  day_of_week: number; // 0=domingo, 1=lunes, ..., 6=sabado
  morning_start: string | null; // "09:00:00"
  morning_end: string | null;
  afternoon_start: string | null;
  afternoon_end: string | null;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrivateLessonException {
  id: string;
  trainer_profile_id: string;
  club_id: string;
  exception_type: "block_day" | "extra_day" | "vacation";
  exception_date: string | null;
  start_date: string | null;
  end_date: string | null;
  morning_start: string | null;
  morning_end: string | null;
  afternoon_start: string | null;
  afternoon_end: string | null;
  slot_duration_minutes: number | null;
  reason: string | null;
  created_at: string;
}

export interface PrivateLessonBooking {
  id: string;
  trainer_profile_id: string;
  club_id: string;
  booked_by_profile_id: string;
  booker_name: string;
  booker_email: string | null;
  booker_phone: string | null;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  num_companions: number;
  court_number: number | null;
  price_per_person: number | null;
  total_price: number | null;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "auto_cancelled";
  created_at: string;
  responded_at: string | null;
  auto_cancel_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
  payment_method: "academia" | "stripe" | "bono" | null;
  stripe_payment_status: string | null;
  student_bono_id: string | null;
}

export interface ComputedSlot {
  date: string; // "2026-03-01"
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  durationMinutes: number;
  status: "free" | "pending" | "confirmed";
  booking?: PrivateLessonBooking;
}

export interface ScheduledClassBlock {
  days_of_week: string[];
  start_time: string;
  duration_minutes: number;
  start_date: string;
  end_date: string;
}

// ============================================================================
// Hooks: Availability
// ============================================================================

export const useTrainerAvailability = (trainerProfileId: string, clubId: string) => {
  return useQuery({
    queryKey: ["private-lesson-availability", trainerProfileId, clubId],
    queryFn: async (): Promise<PrivateLessonAvailability[]> => {
      if (!trainerProfileId || !clubId) return [];

      const { data, error } = await supabase
        .from("private_lesson_availability")
        .select("*")
        .eq("trainer_profile_id", trainerProfileId)
        .eq("club_id", clubId)
        .order("day_of_week");

      if (error) throw error;
      return (data || []) as PrivateLessonAvailability[];
    },
    enabled: !!trainerProfileId && !!clubId,
  });
};

export const useUpsertAvailability = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      data: Omit<PrivateLessonAvailability, "id" | "created_at" | "updated_at">
    ) => {
      const { data: result, error } = await supabase
        .from("private_lesson_availability")
        .upsert(
          {
            trainer_profile_id: data.trainer_profile_id,
            club_id: data.club_id,
            day_of_week: data.day_of_week,
            morning_start: data.morning_start,
            morning_end: data.morning_end,
            afternoon_start: data.afternoon_start,
            afternoon_end: data.afternoon_end,
            slot_duration_minutes: data.slot_duration_minutes,
            is_active: data.is_active,
          },
          { onConflict: "trainer_profile_id,club_id,day_of_week" }
        )
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["private-lesson-availability"] });
      toast({ title: "Disponibilidad guardada" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ============================================================================
// Hooks: Exceptions
// ============================================================================

export const useTrainerExceptions = (
  trainerProfileId: string,
  clubId: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["private-lesson-exceptions", trainerProfileId, clubId, startDate, endDate],
    queryFn: async (): Promise<PrivateLessonException[]> => {
      if (!trainerProfileId || !clubId) return [];

      let query = supabase
        .from("private_lesson_exceptions")
        .select("*")
        .eq("trainer_profile_id", trainerProfileId)
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      // Optionally filter by date range for efficiency
      // This is a broad filter — the slot generation logic does precise filtering
      if (startDate && endDate) {
        query = query.or(
          `exception_date.gte.${startDate},exception_date.lte.${endDate},` +
            `and(start_date.lte.${endDate},end_date.gte.${startDate})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PrivateLessonException[];
    },
    enabled: !!trainerProfileId && !!clubId,
  });
};

export const useCreateException = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      data: Omit<PrivateLessonException, "id" | "created_at">
    ) => {
      const { data: result, error } = await supabase
        .from("private_lesson_exceptions")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["private-lesson-exceptions"] });
      toast({ title: "Excepción creada" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteException = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("private_lesson_exceptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["private-lesson-exceptions"] });
      toast({ title: "Excepción eliminada" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ============================================================================
// Hooks: Bookings
// ============================================================================

export const useTrainerBookings = (
  trainerProfileId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ["private-lesson-bookings", trainerProfileId, startDate, endDate],
    queryFn: async (): Promise<PrivateLessonBooking[]> => {
      if (!trainerProfileId) return [];

      const { data, error } = await supabase
        .from("private_lesson_bookings")
        .select("*")
        .eq("trainer_profile_id", trainerProfileId)
        .gte("lesson_date", startDate)
        .lte("lesson_date", endDate)
        .in("status", ["pending", "confirmed"])
        .order("lesson_date")
        .order("start_time");

      if (error) throw error;
      return (data || []) as PrivateLessonBooking[];
    },
    enabled: !!trainerProfileId && !!startDate && !!endDate,
  });
};

export const useRespondToBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      bookingId,
      action,
      rejectionReason,
    }: {
      bookingId: string;
      action: "confirm" | "reject";
      rejectionReason?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        status: action === "confirm" ? "confirmed" : "rejected",
        responded_at: new Date().toISOString(),
      };
      if (action === "reject" && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("private_lesson_bookings")
        .update(updateData)
        .eq("id", bookingId)
        .eq("status", "pending");

      if (error) throw error;

      // Send WhatsApp notification (fire-and-forget — don't block UX)
      supabase.functions.invoke('send-private-lesson-whatsapp', {
        body: {
          type: action === 'confirm' ? 'confirmed' : 'rejected',
          bookingId,
        },
      }).then(({ error: whatsappError }) => {
        if (whatsappError) console.error('WhatsApp notification error:', whatsappError);
      }).catch(err => console.error('WhatsApp notification error:', err));

      // Trigger Stripe payment capture/cancel (fire-and-forget)
      // Safe for "academia" bookings — manage-private-lesson-payment does early return if no stripe hold
      supabase.functions.invoke('manage-private-lesson-payment', {
        body: {
          bookingId,
          action: action === 'confirm' ? 'capture' : 'cancel',
        },
      }).catch(err => console.error('Payment management error:', err));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["private-lesson-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["private-lesson-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["my-private-lesson-bookings"] });
      toast({
        title:
          variables.action === "confirm" ? "Clase confirmada" : "Solicitud rechazada",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ============================================================================
// Hook: Pending count (for sidebar badge)
// ============================================================================

export const usePendingPrivateLessonCount = (enabled: boolean = true) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["private-lesson-pending-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;

      const { count, error } = await supabase
        .from("private_lesson_bookings")
        .select("*", { count: "exact", head: true })
        .eq("trainer_profile_id", profile.id)
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: enabled && !!profile?.id,
    refetchInterval: 30000, // 30 seconds
  });
};

// ============================================================================
// Hook: Trainer's programmed classes (for overlap filtering)
// ============================================================================

export const useTrainerProgrammedClassesForRange = (
  trainerProfileId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ["trainer-programmed-classes-range", trainerProfileId, startDate, endDate],
    queryFn: async (): Promise<ScheduledClassBlock[]> => {
      if (!trainerProfileId) return [];

      const { data, error } = await supabase
        .from("programmed_classes")
        .select("days_of_week, start_time, duration_minutes, start_date, end_date")
        .eq("trainer_profile_id", trainerProfileId)
        .eq("is_active", true)
        .lte("start_date", endDate)
        .gte("end_date", startDate);

      if (error) throw error;
      return (data || []) as ScheduledClassBlock[];
    },
    enabled: !!trainerProfileId && !!startDate && !!endDate,
  });
};

// ============================================================================
// Slot Generation (pure function — no DB calls)
// ============================================================================

/**
 * Generate time slots from a start-end range using the given duration.
 * E.g., "09:00"-"14:00" with 60min → ["09:00","10:00","11:00","12:00","13:00"]
 */
function generateTimeSlotsFromRange(
  startTime: string,
  endTime: string,
  durationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  let current = startTotal;
  while (current + durationMinutes <= endTotal) {
    const slotEnd = current + durationMinutes;
    const fmtTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    slots.push({ start: fmtTime(current), end: fmtTime(slotEnd) });
    current = slotEnd;
  }

  return slots;
}

// Day index → Spanish name mapping (for matching programmed_classes.days_of_week)
const DAY_NAME_FROM_INDEX: Record<number, string> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/**
 * Compute all slots for a date range given availability, exceptions, bookings,
 * and the trainer's scheduled group classes (to exclude overlapping slots).
 */
export function generateSlotsForDateRange(
  availability: PrivateLessonAvailability[],
  exceptions: PrivateLessonException[],
  bookings: PrivateLessonBooking[],
  startDate: Date,
  endDate: Date,
  scheduledClasses: ScheduledClassBlock[] = []
): ComputedSlot[] {
  const result: ComputedSlot[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    const dow = getDay(day); // 0=Sunday, 1=Monday, ...
    const dayName = DAY_NAME_FROM_INDEX[dow];

    // Check for vacation covering this date
    const isVacation = exceptions.some(
      (ex) =>
        ex.exception_type === "vacation" &&
        ex.start_date &&
        ex.end_date &&
        dateStr >= ex.start_date &&
        dateStr <= ex.end_date
    );
    if (isVacation) continue;

    // Check for block_day
    const isBlocked = exceptions.some(
      (ex) => ex.exception_type === "block_day" && ex.exception_date === dateStr
    );
    if (isBlocked) continue;

    // Check for extra_day (overrides regular availability)
    const extraDay = exceptions.find(
      (ex) => ex.exception_type === "extra_day" && ex.exception_date === dateStr
    );

    let morningStart: string | null = null;
    let morningEnd: string | null = null;
    let afternoonStart: string | null = null;
    let afternoonEnd: string | null = null;
    let duration = 60;

    if (extraDay) {
      morningStart = extraDay.morning_start;
      morningEnd = extraDay.morning_end;
      afternoonStart = extraDay.afternoon_start;
      afternoonEnd = extraDay.afternoon_end;
      duration = extraDay.slot_duration_minutes || 60;
    } else {
      // Regular availability for this day of week
      const avail = availability.find(
        (a) => a.day_of_week === dow && a.is_active
      );
      if (!avail) continue;

      morningStart = avail.morning_start;
      morningEnd = avail.morning_end;
      afternoonStart = avail.afternoon_start;
      afternoonEnd = avail.afternoon_end;
      duration = avail.slot_duration_minutes;
    }

    // Generate morning slots
    const timeSlots: { start: string; end: string }[] = [];
    if (morningStart && morningEnd) {
      timeSlots.push(
        ...generateTimeSlotsFromRange(
          morningStart.slice(0, 5),
          morningEnd.slice(0, 5),
          duration
        )
      );
    }
    // Generate afternoon slots
    if (afternoonStart && afternoonEnd) {
      timeSlots.push(
        ...generateTimeSlotsFromRange(
          afternoonStart.slice(0, 5),
          afternoonEnd.slice(0, 5),
          duration
        )
      );
    }

    // Get scheduled group classes active on this day
    const dayClasses = scheduledClasses.filter((sc) => {
      const normalizedDays = sc.days_of_week.map((d) =>
        d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );
      return (
        normalizedDays.includes(dayName) &&
        sc.start_date <= dateStr &&
        sc.end_date >= dateStr
      );
    });

    // Filter out slots that overlap with scheduled group classes
    const availableSlots = timeSlots.filter((slot) => {
      const slotStartMin = parseTimeToMinutes(slot.start);
      const slotEndMin = parseTimeToMinutes(slot.end);

      return !dayClasses.some((sc) => {
        const classStartMin = parseTimeToMinutes(sc.start_time);
        const classEndMin = classStartMin + sc.duration_minutes;
        return slotStartMin < classEndMin && classStartMin < slotEndMin;
      });
    });

    // Cross with bookings for this date
    const dayBookings = bookings.filter((b) => b.lesson_date === dateStr);

    for (const slot of availableSlots) {
      const matchingBooking = dayBookings.find(
        (b) => b.start_time.slice(0, 5) === slot.start
      );

      if (matchingBooking) {
        result.push({
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          durationMinutes: duration,
          status: matchingBooking.status === "confirmed" ? "confirmed" : "pending",
          booking: matchingBooking,
        });
      } else {
        result.push({
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          durationMinutes: duration,
          status: "free",
        });
      }
    }
  }

  return result;
}

// ============================================================================
// Hook: Private lesson bookings for attendance views (read-only)
// ============================================================================

export interface PrivateLessonBookingWithTrainer extends PrivateLessonBooking {
  trainer?: { full_name: string } | null;
  companion_details: { name: string; profile_id?: string }[];
}

export const usePrivateLessonBookingsForAttendance = (
  startDate: string,
  endDate: string,
  trainerFilter?: string,
  effectiveClubId?: string,
  superAdminClubIds?: string[]
) => {
  return useQuery({
    queryKey: ["private-lesson-bookings-attendance", startDate, endDate, trainerFilter, effectiveClubId, superAdminClubIds],
    queryFn: async (): Promise<PrivateLessonBookingWithTrainer[]> => {
      if (!startDate || !endDate) return [];

      let query = supabase
        .from("private_lesson_bookings")
        .select("*, trainer:profiles!trainer_profile_id(full_name)")
        .gte("lesson_date", startDate)
        .lte("lesson_date", endDate)
        .in("status", ["pending", "confirmed"])
        .order("lesson_date")
        .order("start_time");

      if (trainerFilter) {
        query = query.eq("trainer_profile_id", trainerFilter);
      }

      // Club filtering (same pattern as useTodayAttendance)
      if (effectiveClubId) {
        query = query.eq("club_id", effectiveClubId);
      } else if (superAdminClubIds && superAdminClubIds.length > 0) {
        query = query.in("club_id", superAdminClubIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((d: any) => ({
        ...d,
        companion_details: Array.isArray(d.companion_details) ? d.companion_details : [],
      })) as PrivateLessonBookingWithTrainer[];
    },
    enabled: !!startDate && !!endDate,
  });
};