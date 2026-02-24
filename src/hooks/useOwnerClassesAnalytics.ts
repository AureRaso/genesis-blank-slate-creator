/**
 * useOwnerClassesAnalytics
 *
 * Hook para obtener métricas de uso del módulo "Clases Disponibles"
 * a nivel global (todos los clubes). Diseñado para monitoreo interno
 * y demos comerciales.
 *
 * IMPORTANTE: Este hook SOLO debe usarse en el panel de Owner.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- INTERFACES ---

interface GlobalKPIs {
  totalClasses: number;
  activeClasses: number;
  uniqueStudents: number;
  totalEnrollments: number;
  totalWaitlistRequests: number;
  clubsUsingModule: number;
  averageCapacity: number;
  openClasses: number;
}

interface ClubUsageRow {
  clubId: string;
  clubName: string;
  totalClasses: number;
  activeClasses: number;
  openClasses: number;
  uniqueStudents: number;
  totalEnrollments: number;
  waitlistAccepted: number;
  waitlistRejected: number;
  waitlistPending: number;
  waitlistExpired: number;
  trainerCount: number;
  firstClassDate: string | null;
  lastClassDate: string | null;
  tier: "Power User" | "Activo" | "Moderado" | "Bajo";
}

interface WaitlistDistribution {
  accepted: number;
  rejected: number;
  pending: number;
  expired: number;
}

interface FeatureAdoption {
  clubsWithWaitlist: number;
  clubsWithOpenClasses: number;
  clubsWithMultiTrainers: number;
  totalClubs: number;
}

// --- HELPER: Paginated fetch ---

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  tableName: string,
  columns: string,
  filters?: (query: any) => any
): Promise<T[]> {
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters) {
      query = filters(query);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`Error fetching ${tableName} page ${page}:`, error);
      break;
    }
    if (!data || data.length < PAGE_SIZE) hasMore = false;
    allData = [...allData, ...(data || [])];
    page++;
  }

  return allData;
}

// --- HOOK ---

export const useOwnerClassesAnalytics = () => {
  // Query 1: Global KPIs
  const { data: globalKPIs, isLoading: kpisLoading } = useQuery({
    queryKey: ["owner-classes-analytics-kpis"],
    queryFn: async (): Promise<GlobalKPIs> => {
      const { count: totalClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true });

      const { count: activeClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: totalEnrollments } = await supabase
        .from("class_participants")
        .select("*", { count: "exact", head: true });

      const participantsData = await fetchAllRows<{ student_enrollment_id: string }>(
        "class_participants",
        "student_enrollment_id"
      );
      const uniqueStudents = new Set(participantsData.map((p) => p.student_enrollment_id)).size;

      const { count: totalWaitlistRequests } = await supabase
        .from("class_waitlist")
        .select("*", { count: "exact", head: true });

      const clubsData = await fetchAllRows<{ club_id: string }>(
        "programmed_classes",
        "club_id"
      );
      const clubsUsingModule = new Set(clubsData.map((c) => c.club_id)).size;

      const capacityData = await fetchAllRows<{ max_participants: number }>(
        "programmed_classes",
        "max_participants",
        (q) => q.eq("is_active", true)
      );
      const avgCapacity =
        capacityData.length > 0
          ? Math.round(
              (capacityData.reduce((sum, c) => sum + (c.max_participants || 4), 0) /
                capacityData.length) *
                10
            ) / 10
          : 0;

      const { count: openClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true })
        .eq("is_open", true)
        .eq("is_active", true);

      return {
        totalClasses: totalClasses || 0,
        activeClasses: activeClasses || 0,
        uniqueStudents,
        totalEnrollments: totalEnrollments || 0,
        totalWaitlistRequests: totalWaitlistRequests || 0,
        clubsUsingModule,
        averageCapacity: avgCapacity,
        openClasses: openClasses || 0,
      };
    },
    retry: false,
    staleTime: 60000,
  });

  // Query 2: Club Usage Ranking
  const { data: clubUsageRanking, isLoading: rankingLoading } = useQuery({
    queryKey: ["owner-classes-analytics-ranking"],
    queryFn: async (): Promise<ClubUsageRow[]> => {
      const { data: clubs } = await supabase
        .from("clubs")
        .select("id, name")
        .order("name");

      if (!clubs || clubs.length === 0) return [];

      const allClasses = await fetchAllRows<{
        id: string;
        club_id: string;
        is_active: boolean;
        is_open: boolean;
        trainer_profile_id: string | null;
        trainer_profile_id_2: string | null;
        start_date: string | null;
      }>("programmed_classes", "id, club_id, is_active, is_open, trainer_profile_id, trainer_profile_id_2, start_date");

      const allParticipants = await fetchAllRows<{
        id: string;
        class_id: string;
        student_enrollment_id: string;
        status: string;
      }>("class_participants", "id, class_id, student_enrollment_id, status");

      const allWaitlist = await fetchAllRows<{
        id: string;
        class_id: string;
        status: string;
      }>("class_waitlist", "id, class_id, status");

      // Index classes by club_id for fast lookup
      const classesByClub = new Map<string, typeof allClasses>();
      allClasses.forEach((c) => {
        const arr = classesByClub.get(c.club_id) || [];
        arr.push(c);
        classesByClub.set(c.club_id, arr);
      });

      // Index class_id -> club_id
      const classToClub = new Map<string, string>();
      allClasses.forEach((c) => classToClub.set(c.id, c.club_id));

      // Index participants and waitlist by club_id
      const participantsByClub = new Map<string, typeof allParticipants>();
      allParticipants.forEach((p) => {
        const clubId = classToClub.get(p.class_id);
        if (clubId) {
          const arr = participantsByClub.get(clubId) || [];
          arr.push(p);
          participantsByClub.set(clubId, arr);
        }
      });

      const waitlistByClub = new Map<string, typeof allWaitlist>();
      allWaitlist.forEach((w) => {
        const clubId = classToClub.get(w.class_id);
        if (clubId) {
          const arr = waitlistByClub.get(clubId) || [];
          arr.push(w);
          waitlistByClub.set(clubId, arr);
        }
      });

      const clubRows: ClubUsageRow[] = clubs.map((club) => {
        const clubClasses = classesByClub.get(club.id) || [];
        const activeClasses = clubClasses.filter((c) => c.is_active).length;
        const openClasses = clubClasses.filter((c) => c.is_open && c.is_active).length;

        const clubParticipants = participantsByClub.get(club.id) || [];
        const uniqueStudents = new Set(
          clubParticipants.map((p) => p.student_enrollment_id)
        ).size;
        const totalEnrollments = clubParticipants.length;

        const clubWaitlist = waitlistByClub.get(club.id) || [];
        const waitlistAccepted = clubWaitlist.filter((w) => w.status === "accepted").length;
        const waitlistRejected = clubWaitlist.filter((w) => w.status === "rejected").length;
        const waitlistPending = clubWaitlist.filter((w) => w.status === "pending").length;
        const waitlistExpired = clubWaitlist.filter((w) => w.status === "expired").length;

        const trainerIds = new Set<string>();
        clubClasses.forEach((c) => {
          if (c.trainer_profile_id) trainerIds.add(c.trainer_profile_id);
          if (c.trainer_profile_id_2) trainerIds.add(c.trainer_profile_id_2);
        });

        const dates = clubClasses
          .map((c) => c.start_date)
          .filter(Boolean)
          .sort() as string[];

        let tier: ClubUsageRow["tier"] = "Bajo";
        if (clubClasses.length >= 500 && uniqueStudents >= 40) tier = "Power User";
        else if (clubClasses.length >= 100 && uniqueStudents >= 10) tier = "Activo";
        else if (clubClasses.length >= 10) tier = "Moderado";

        return {
          clubId: club.id,
          clubName: club.name,
          totalClasses: clubClasses.length,
          activeClasses,
          openClasses,
          uniqueStudents,
          totalEnrollments,
          waitlistAccepted,
          waitlistRejected,
          waitlistPending,
          waitlistExpired,
          trainerCount: trainerIds.size,
          firstClassDate: dates.length > 0 ? dates[0] : null,
          lastClassDate: dates.length > 0 ? dates[dates.length - 1] : null,
          tier,
        };
      });

      return clubRows
        .filter((c) => c.totalClasses > 0)
        .sort((a, b) => b.totalClasses - a.totalClasses);
    },
    retry: false,
    staleTime: 60000,
  });

  // Query 3: Waitlist Distribution
  const { data: waitlistDistribution, isLoading: waitlistLoading } = useQuery({
    queryKey: ["owner-classes-analytics-waitlist"],
    queryFn: async (): Promise<WaitlistDistribution> => {
      const data = await fetchAllRows<{ status: string }>("class_waitlist", "status");

      return {
        accepted: data.filter((w) => w.status === "accepted").length,
        rejected: data.filter((w) => w.status === "rejected").length,
        pending: data.filter((w) => w.status === "pending").length,
        expired: data.filter((w) => w.status === "expired").length,
      };
    },
    retry: false,
    staleTime: 60000,
  });

  // Query 4: Feature Adoption
  const { data: featureAdoption, isLoading: adoptionLoading } = useQuery({
    queryKey: ["owner-classes-analytics-adoption"],
    queryFn: async (): Promise<FeatureAdoption> => {
      const { data: clubs } = await supabase.from("clubs").select("id");
      const totalClubs = clubs?.length || 0;

      const allClasses = await fetchAllRows<{
        id: string;
        club_id: string;
        is_open: boolean;
        trainer_profile_id_2: string | null;
      }>("programmed_classes", "id, club_id, is_open, trainer_profile_id_2");

      const allWaitlist = await fetchAllRows<{ class_id: string }>(
        "class_waitlist",
        "class_id"
      );

      const classToClub = new Map<string, string>();
      allClasses.forEach((c) => classToClub.set(c.id, c.club_id));

      const clubsWithWaitlistSet = new Set<string>();
      allWaitlist.forEach((w) => {
        const clubId = classToClub.get(w.class_id);
        if (clubId) clubsWithWaitlistSet.add(clubId);
      });

      const clubsWithOpen = new Set(
        allClasses.filter((c) => c.is_open).map((c) => c.club_id)
      );

      const clubsWithMulti = new Set(
        allClasses.filter((c) => c.trainer_profile_id_2).map((c) => c.club_id)
      );

      return {
        clubsWithWaitlist: clubsWithWaitlistSet.size,
        clubsWithOpenClasses: clubsWithOpen.size,
        clubsWithMultiTrainers: clubsWithMulti.size,
        totalClubs,
      };
    },
    retry: false,
    staleTime: 60000,
  });

  return {
    globalKPIs,
    kpisLoading,
    clubUsageRanking,
    rankingLoading,
    waitlistDistribution,
    waitlistLoading,
    featureAdoption,
    adoptionLoading,
  };
};
