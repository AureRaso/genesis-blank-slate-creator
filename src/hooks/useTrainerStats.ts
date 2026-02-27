import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrainerStats {
  groupClasses: {
    total: number;
    active: number;
    inactive: number;
    totalStudents: number;
  };
  privateLessons: {
    total: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    totalRevenue: number;
  };
  cancellations: number;
}

export const useTrainerStats = (
  trainerProfileId: string | undefined,
  clubId: string | undefined,
  enabled: boolean
) => {
  const groupClassesQuery = useQuery({
    queryKey: ["trainer-stats-group", trainerProfileId, clubId],
    queryFn: async () => {
      if (!trainerProfileId || !clubId) return null;

      const { data, error } = await supabase
        .from("programmed_classes")
        .select("id, is_active, class_participants(count)")
        .or(
          `trainer_profile_id.eq.${trainerProfileId},trainer_profile_id_2.eq.${trainerProfileId}`
        )
        .eq("club_id", clubId);

      if (error) throw error;

      const classes = data || [];
      const active = classes.filter((c) => c.is_active).length;
      const totalStudents = classes.reduce((sum, c) => {
        const count = (c.class_participants as any)?.[0]?.count ?? 0;
        return sum + count;
      }, 0);

      return {
        total: classes.length,
        active,
        inactive: classes.length - active,
        totalStudents,
      };
    },
    enabled: enabled && !!trainerProfileId && !!clubId,
    staleTime: 5 * 60 * 1000,
  });

  const bookingsQuery = useQuery({
    queryKey: ["trainer-stats-bookings", trainerProfileId],
    queryFn: async () => {
      if (!trainerProfileId) return null;

      const { data, error } = await supabase
        .from("private_lesson_bookings")
        .select("status, total_price")
        .eq("trainer_profile_id", trainerProfileId);

      if (error) throw error;

      const bookings = data || [];
      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const cancelled = bookings.filter(
        (b) =>
          b.status === "cancelled" ||
          b.status === "rejected" ||
          b.status === "auto_cancelled"
      ).length;
      const pending = bookings.filter((b) => b.status === "pending").length;
      const totalRevenue = bookings
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      return {
        total: bookings.length,
        confirmed,
        cancelled,
        pending,
        totalRevenue,
      };
    },
    enabled: enabled && !!trainerProfileId,
    staleTime: 5 * 60 * 1000,
  });

  // Cancellation query fetches class IDs independently
  const cancellationsQuery = useQuery({
    queryKey: ["trainer-stats-cancellations", trainerProfileId, clubId],
    queryFn: async () => {
      if (!trainerProfileId || !clubId) return 0;

      // First get the trainer's class IDs
      const { data: classes, error: classError } = await supabase
        .from("programmed_classes")
        .select("id")
        .or(
          `trainer_profile_id.eq.${trainerProfileId},trainer_profile_id_2.eq.${trainerProfileId}`
        )
        .eq("club_id", clubId);

      if (classError) throw classError;
      if (!classes || classes.length === 0) return 0;

      const ids = classes.map((c) => c.id);
      const { count, error } = await supabase
        .from("cancelled_classes")
        .select("id", { count: "exact", head: true })
        .in("programmed_class_id", ids);

      if (error) throw error;
      return count || 0;
    },
    enabled: enabled && !!trainerProfileId && !!clubId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    groupClassesQuery.isLoading ||
    bookingsQuery.isLoading ||
    cancellationsQuery.isLoading;

  const stats: TrainerStats | null =
    groupClassesQuery.data && bookingsQuery.data
      ? {
          groupClasses: groupClassesQuery.data,
          privateLessons: bookingsQuery.data,
          cancellations: cancellationsQuery.data ?? 0,
        }
      : null;

  return { stats, isLoading };
};
