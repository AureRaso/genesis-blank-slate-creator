/**
 * useClubsManagement
 *
 * Hook para gestión completa de clubes desde el panel de owner.
 * Incluye métricas detalladas, estudiantes, trainers y clases por club.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClubDetail {
  id: string;
  name: string;
  created_at: string;
  totalStudents: number;
  totalTrainers: number;
  totalClasses: number;
  activeEnrollments: number;
  studentsThisMonth: number;
  levelDistribution: {
    beginner: number; // 1.0-3.9
    intermediate: number; // 4.0-6.9
    advanced: number; // 7.0-10.0
  };
}

export interface ClubStats {
  totalClubs: number;
  totalStudentsAcrossClubs: number;
  totalTrainersAcrossClubs: number;
  averageStudentsPerClub: number;
  mostActiveClub: {
    name: string;
    studentCount: number;
  } | null;
}

export const useClubsManagement = () => {
  // Obtener lista completa de clubes con métricas
  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ["owner-clubs-management"],
    queryFn: async (): Promise<ClubDetail[]> => {
      try {
        // Obtener todos los clubes
        const { data: clubsData, error: clubsError } = await supabase
          .from("clubs")
          .select("id, name, created_at")
          .order("name", { ascending: true });

        if (clubsError) {
          console.warn("Error fetching clubs:", clubsError);
          return [];
        }

        if (!clubsData || clubsData.length === 0) {
          return [];
        }

        // Para cada club, obtener métricas
        const clubsWithMetrics = await Promise.all(
          clubsData.map(async (club) => {
            // Total de jugadores (players en el club)
            const { count: totalStudents } = await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("club_id", club.id)
              .eq("role", "player");

            // Total de trainers
            const { count: totalTrainers } = await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("club_id", club.id)
              .eq("role", "trainer");

            // Total de clases programadas (últimos 30 días)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: totalClasses } = await supabase
              .from("programmed_classes")
              .select("*", { count: "exact", head: true })
              .eq("club_id", club.id)
              .gte("start_date", thirtyDaysAgo.toISOString().split("T")[0]);

            // Jugadores nuevos este mes
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            currentMonthStart.setHours(0, 0, 0, 0);

            const { count: studentsThisMonth } = await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("club_id", club.id)
              .eq("role", "player")
              .gte("created_at", currentMonthStart.toISOString());

            // Distribución por nivel
            const { data: enrollments } = await supabase
              .from("student_enrollments")
              .select("level")
              .eq("club_id", club.id)
              .eq("status", "active");

            const levelDistribution = {
              beginner: 0,
              intermediate: 0,
              advanced: 0,
            };

            enrollments?.forEach((enrollment) => {
              const level = enrollment.level || 0;
              if (level >= 1.0 && level < 4.0) {
                levelDistribution.beginner++;
              } else if (level >= 4.0 && level < 7.0) {
                levelDistribution.intermediate++;
              } else if (level >= 7.0 && level <= 10.0) {
                levelDistribution.advanced++;
              }
            });

            return {
              id: club.id,
              name: club.name,
              created_at: club.created_at,
              totalStudents: totalStudents || 0,
              totalTrainers: totalTrainers || 0,
              totalClasses: totalClasses || 0,
              activeEnrollments: totalStudents || 0,
              studentsThisMonth: studentsThisMonth || 0,
              levelDistribution,
            };
          })
        );

        return clubsWithMetrics;
      } catch (error) {
        console.warn("Error in useClubsManagement:", error);
        return [];
      }
    },
    refetchInterval: 60000, // Refrescar cada minuto
    retry: false,
  });

  // Estadísticas generales de todos los clubes
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["owner-clubs-stats"],
    queryFn: async (): Promise<ClubStats> => {
      try {
        const totalClubs = clubs?.length || 0;
        const totalStudentsAcrossClubs = clubs?.reduce((sum, club) => sum + club.totalStudents, 0) || 0;
        const totalTrainersAcrossClubs = clubs?.reduce((sum, club) => sum + club.totalTrainers, 0) || 0;
        const averageStudentsPerClub = totalClubs > 0 ? Math.round(totalStudentsAcrossClubs / totalClubs) : 0;

        // Club más activo (con más estudiantes)
        const mostActiveClub = clubs?.reduce((max, club) => {
          return club.totalStudents > (max?.totalStudents || 0) ? club : max;
        }, clubs[0] as ClubDetail | undefined);

        return {
          totalClubs,
          totalStudentsAcrossClubs,
          totalTrainersAcrossClubs,
          averageStudentsPerClub,
          mostActiveClub: mostActiveClub
            ? { name: mostActiveClub.name, studentCount: mostActiveClub.totalStudents }
            : null,
        };
      } catch (error) {
        console.warn("Error calculating club stats:", error);
        return {
          totalClubs: 0,
          totalStudentsAcrossClubs: 0,
          totalTrainersAcrossClubs: 0,
          averageStudentsPerClub: 0,
          mostActiveClub: null,
        };
      }
    },
    enabled: !!clubs && clubs.length > 0,
    retry: false,
  });

  return {
    clubs: clubs || [],
    clubsLoading,
    stats,
    statsLoading,
  };
};
