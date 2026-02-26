import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useTrainerAvailability,
  useTrainerExceptions,
  useTrainerBookings,
  useTrainerProgrammedClassesForRange,
  generateSlotsForDateRange,
  ComputedSlot,
} from "@/hooks/usePrivateLessons";
import { PrivateLessonRates } from "@/hooks/useTrainers";
import { startOfWeek, endOfWeek, format } from "date-fns";

// ============================================================================
// Types
// ============================================================================

export interface TrainerWithRates {
  id: string;
  profile_id: string;
  specialty: string | null;
  photo_url: string | null;
  private_lesson_rates: PrivateLessonRates;
  booking_window_days: number;
  min_notice_hours: number;
  full_name: string;
  email: string;
  club_id: string;
  club_name: string;
}

export interface CompanionInfo {
  name: string;
  email?: string;
  phone?: string;
  type: "registered" | "guest";
  user_code?: string;
  profile_id?: string;
}

export interface CreateBookingInput {
  trainer_profile_id: string;
  club_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  num_companions: number;
  price_per_person: number | null;
  total_price: number | null;
  companion_details: CompanionInfo[];
}


// ============================================================================
// Hook: Club trainers with private lesson rates configured
// ============================================================================

export const useClubTrainersWithRates = (clubId: string) => {
  return useQuery({
    queryKey: ["club-trainers-with-rates", clubId],
    queryFn: async (): Promise<TrainerWithRates[]> => {
      if (!clubId) return [];

      // Get club name
      const { data: clubData } = await supabase
        .from("clubs")
        .select("id, name")
        .eq("id", clubId)
        .single();
      const clubName = clubData?.name || "";

      // Strategy 1: trainer_clubs join table
      const { data: trainerClubs, error: tcError } = await supabase
        .from("trainer_clubs")
        .select("trainer_profile_id")
        .eq("club_id", clubId);

      if (tcError) throw tcError;

      const idsFromJoin = (trainerClubs || []).map((tc) => tc.trainer_profile_id);

      // Strategy 2: profiles with club_id + role trainer
      const { data: directProfiles, error: dpError } = await supabase
        .from("profiles")
        .select("id")
        .eq("club_id", clubId)
        .eq("role", "trainer");

      if (dpError) throw dpError;

      const idsFromProfiles = (directProfiles || []).map((p) => p.id);

      // Merge unique profile IDs
      const profileIds = [...new Set([...idsFromJoin, ...idsFromProfiles])];
      if (profileIds.length === 0) return [];

      // Get trainers with rates
      const { data: trainers, error: tError } = await supabase
        .from("trainers")
        .select(
          "id, profile_id, specialty, photo_url, private_lesson_rates, booking_window_days, min_notice_hours, profiles:profile_id(id, full_name, email)"
        )
        .in("profile_id", profileIds)
        .eq("is_active", true);

      if (tError) throw tError;

      // Filter trainers that have at least one duration with rates configured
      const result: TrainerWithRates[] = [];
      for (const t of trainers || []) {
        const rates = t.private_lesson_rates as unknown as PrivateLessonRates;
        if (!rates || typeof rates !== "object") continue;

        // Check if any duration has at least price_1_player set
        const hasRates = Object.values(rates).some(
          (dr) => dr && dr.price_1_player != null && dr.price_1_player > 0
        );
        if (!hasRates) continue;

        const profile = t.profiles as any;

        result.push({
          id: t.id,
          profile_id: t.profile_id,
          specialty: t.specialty,
          photo_url: t.photo_url,
          private_lesson_rates: rates,
          booking_window_days: (t as any).booking_window_days ?? 7,
          min_notice_hours: (t as any).min_notice_hours ?? 24,
          full_name: profile?.full_name || "",
          email: profile?.email || "",
          club_id: clubId,
          club_name: clubName,
        });
      }

      return result;
    },
    enabled: !!clubId,
  });
};

// ============================================================================
// Hook: Free slots for a trainer on a specific date
// ============================================================================

export const useTrainerFreeSlots = (
  trainerProfileId: string,
  clubId: string,
  date: string, // "yyyy-MM-dd"
  minNoticeHours: number = 24
) => {
  // We need the week range that contains the date for the hooks
  const targetDate = date ? new Date(date + "T12:00:00") : new Date();
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const { data: availability = [] } = useTrainerAvailability(
    trainerProfileId,
    clubId
  );
  const { data: exceptions = [] } = useTrainerExceptions(
    trainerProfileId,
    clubId,
    weekStartStr,
    weekEndStr
  );
  const { data: bookings = [] } = useTrainerBookings(
    trainerProfileId,
    weekStartStr,
    weekEndStr
  );
  const { data: scheduledClasses = [] } = useTrainerProgrammedClassesForRange(
    trainerProfileId,
    weekStartStr,
    weekEndStr
  );

  return useQuery({
    queryKey: [
      "trainer-free-slots",
      trainerProfileId,
      clubId,
      date,
      minNoticeHours,
      availability,
      exceptions,
      bookings,
      scheduledClasses,
    ],
    queryFn: (): ComputedSlot[] => {
      if (!trainerProfileId || !clubId || !date) return [];

      const dayStart = new Date(date + "T00:00:00");
      const dayEnd = new Date(date + "T23:59:59");

      const allSlots = generateSlotsForDateRange(
        availability,
        exceptions,
        bookings,
        dayStart,
        dayEnd,
        scheduledClasses
      );

      // Only return free slots for that specific date, respecting min notice
      const minNoticeDeadline = new Date(Date.now() + minNoticeHours * 60 * 60 * 1000);

      return allSlots.filter((s) => {
        if (s.date !== date || s.status !== "free") return false;
        const slotStart = new Date(`${s.date}T${s.startTime}:00`);
        return slotStart >= minNoticeDeadline;
      });
    },
    enabled:
      !!trainerProfileId &&
      !!clubId &&
      !!date &&
      availability.length >= 0 && // always true, just re-runs when data changes
      true,
  });
};

// ============================================================================
// Hook: Create private lesson booking
// ============================================================================

export const useCreatePrivateLessonBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No autenticado");

      // Get profile for name/email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from("private_lesson_bookings")
        .insert({
          trainer_profile_id: input.trainer_profile_id,
          club_id: input.club_id,
          booked_by_profile_id: user.id,
          booker_name: profile.full_name || "",
          booker_email: profile.email || null,
          booker_phone: profile.phone || null,
          lesson_date: input.lesson_date,
          start_time: input.start_time,
          end_time: input.end_time,
          duration_minutes: input.duration_minutes,
          num_companions: input.num_companions,
          price_per_person: input.price_per_person,
          total_price: input.total_price,
          status: "pending",
          companion_details: input.companion_details,
          payment_method: "academia",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["private-lesson-bookings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["private-lesson-pending-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["trainer-free-slots"],
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
// Hook: Recent companions (from past bookings)
// ============================================================================

export interface RecentCompanion {
  name: string;
  profile_id?: string;
  user_code?: string;
  email?: string;
  phone?: string;
  type: "registered" | "guest";
  count: number; // how many times they've been a companion
}

export const useRecentCompanions = (clubId: string) => {
  return useQuery({
    queryKey: ["recent-companions", clubId],
    queryFn: async (): Promise<RecentCompanion[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("private_lesson_bookings")
        .select("companion_details")
        .eq("booked_by_profile_id", user.id)
        .eq("club_id", clubId)
        .in("status", ["confirmed", "pending"])
        .not("companion_details", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data) return [];

      // Extract and deduplicate companions
      const companionMap = new Map<string, RecentCompanion>();

      for (const booking of data) {
        const details = booking.companion_details as CompanionInfo[] | null;
        if (!Array.isArray(details)) continue;

        for (const c of details) {
          if (!c.name) continue;

          // Unique key: profile_id for registered, name+phone for guests
          const key = c.profile_id || `guest:${c.name}:${c.phone || ""}`;

          const existing = companionMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            companionMap.set(key, {
              name: c.name,
              profile_id: c.profile_id,
              user_code: c.user_code,
              email: c.email,
              phone: c.phone,
              type: c.profile_id ? "registered" : "guest",
              count: 1,
            });
          }
        }
      }

      // Sort by frequency (most used first)
      return Array.from(companionMap.values()).sort((a, b) => b.count - a.count);
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

// ============================================================================
// Types for player's own bookings
// ============================================================================

export interface MyPrivateLessonBooking {
  id: string;
  trainer_profile_id: string;
  club_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  num_companions: number;
  price_per_person: number | null;
  total_price: number | null;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "auto_cancelled";
  payment_method: string | null;
  created_at: string;
  trainer_name: string;
  club_name: string;
  booker_name: string;
  is_companion: boolean;
}

// ============================================================================
// Hook: My private lesson bookings (upcoming, pending/confirmed)
// Includes both bookings I created AND bookings where I'm a companion
// ============================================================================

export const useMyPrivateLessonBookings = () => {
  return useQuery({
    queryKey: ["my-private-lesson-bookings"],
    queryFn: async (): Promise<MyPrivateLessonBooking[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch own bookings + companion bookings in parallel
      // RLS allows both: booked_by_profile_id = auth.uid() OR profile_id in companion_details
      // We fetch ALL visible bookings (RLS handles access) and tag them
      const { data, error } = await supabase
        .from("private_lesson_bookings")
        .select(`
          id, trainer_profile_id, club_id, lesson_date, start_time, end_time,
          duration_minutes, num_companions, price_per_person, total_price,
          status, payment_method, created_at, booked_by_profile_id, booker_name
        `)
        .in("status", ["pending", "confirmed"])
        .gte("lesson_date", today)
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get trainer names and club names
      const trainerIds = [...new Set(data.map((b) => b.trainer_profile_id))];
      const clubIds = [...new Set(data.map((b) => b.club_id))];

      const [{ data: profiles }, { data: clubs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", trainerIds),
        supabase.from("clubs").select("id, name").in("id", clubIds),
      ]);

      const trainerMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
      const clubMap = new Map((clubs || []).map((c) => [c.id, c.name]));

      return data.map((b) => ({
        ...b,
        trainer_name: trainerMap.get(b.trainer_profile_id) || "",
        club_name: clubMap.get(b.club_id) || "",
        booker_name: b.booker_name || "",
        is_companion: b.booked_by_profile_id !== user.id,
      }));
    },
  });
};

