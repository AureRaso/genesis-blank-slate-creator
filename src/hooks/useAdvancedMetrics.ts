/**
 * useAdvancedMetrics
 *
 * Hook para obtener métricas avanzadas y estadísticas para demostración comercial.
 * Incluye datos de crecimiento, engagement, retención, etc.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GrowthMetrics {
  currentMonth: {
    newUsers: number;
    newClubs: number;
    newEnrollments: number;
  };
  lastMonth: {
    newUsers: number;
    newClubs: number;
    newEnrollments: number;
  };
  growth: {
    usersGrowth: number;
    clubsGrowth: number;
    enrollmentsGrowth: number;
  };
}

interface EngagementMetrics {
  totalClasses: number;
  totalParticipants: number;
  averageClassSize: number;
  classAttendanceRate: number;
  activeUsersLast30Days: number;
}

interface ClubMetrics {
  totalClubs: number;
  activeClubs: number;
  clubsBySize: {
    small: number; // < 20 alumnos
    medium: number; // 20-50 alumnos
    large: number; // > 50 alumnos
  };
  topClubs: Array<{
    id: string;
    name: string;
    studentsCount: number;
    classesCount: number;
  }>;
}

interface UserDistribution {
  byRole: {
    players: number;
    trainers: number;
    admins: number;
    owners: number;
  };
  byLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  totalActive: number;
}

export const useAdvancedMetrics = () => {
  // Métricas de crecimiento
  const { data: growthMetrics, isLoading: growthLoading } = useQuery({
    queryKey: ["advanced-growth-metrics"],
    queryFn: async (): Promise<GrowthMetrics> => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Usuarios este mes
      const { count: currentMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      // Usuarios mes pasado
      const { count: lastMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Clubes este mes
      const { count: currentMonthClubs } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      // Clubes mes pasado
      const { count: lastMonthClubs } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Enrollments este mes
      const { count: currentMonthEnrollments } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      // Enrollments mes pasado
      const { count: lastMonthEnrollments } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Calcular % de crecimiento
      const usersGrowth = lastMonthUsers
        ? ((currentMonthUsers! - lastMonthUsers) / lastMonthUsers) * 100
        : 0;
      const clubsGrowth = lastMonthClubs
        ? ((currentMonthClubs! - lastMonthClubs) / lastMonthClubs) * 100
        : 0;
      const enrollmentsGrowth = lastMonthEnrollments
        ? ((currentMonthEnrollments! - lastMonthEnrollments) / lastMonthEnrollments) * 100
        : 0;

      return {
        currentMonth: {
          newUsers: currentMonthUsers || 0,
          newClubs: currentMonthClubs || 0,
          newEnrollments: currentMonthEnrollments || 0,
        },
        lastMonth: {
          newUsers: lastMonthUsers || 0,
          newClubs: lastMonthClubs || 0,
          newEnrollments: lastMonthEnrollments || 0,
        },
        growth: {
          usersGrowth: Math.round(usersGrowth),
          clubsGrowth: Math.round(clubsGrowth),
          enrollmentsGrowth: Math.round(enrollmentsGrowth),
        },
      };
    },
    retry: false,
  });

  // Métricas de engagement
  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery({
    queryKey: ["advanced-engagement-metrics"],
    queryFn: async (): Promise<EngagementMetrics> => {
      // Total de clases programadas
      const { count: totalClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true });

      // Total de participantes en clases
      const { count: totalParticipants } = await supabase
        .from("class_participants")
        .select("*", { count: "exact", head: true });

      // Promedio de tamaño de clase
      const averageClassSize = totalClasses && totalClasses > 0
        ? Math.round((totalParticipants || 0) / totalClasses)
        : 0;

      // Tasa de asistencia (confirmados vs total)
      const { count: confirmedParticipants } = await supabase
        .from("class_participants")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed");

      const classAttendanceRate = totalParticipants && totalParticipants > 0
        ? Math.round(((confirmedParticipants || 0) / totalParticipants) * 100)
        : 0;

      // Usuarios activos últimos 30 días (con enrollments activos)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("updated_at", thirtyDaysAgo.toISOString());

      return {
        totalClasses: totalClasses || 0,
        totalParticipants: totalParticipants || 0,
        averageClassSize,
        classAttendanceRate,
        activeUsersLast30Days: activeUsers || 0,
      };
    },
    retry: false,
  });

  // Métricas por club
  const { data: clubMetrics, isLoading: clubsLoading } = useQuery({
    queryKey: ["advanced-club-metrics"],
    queryFn: async (): Promise<ClubMetrics> => {
      // Total de clubes
      const { count: totalClubs } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true });

      // Obtener todos los clubes con sus enrollments
      const { data: clubs } = await supabase
        .from("clubs")
        .select("id, name");

      if (!clubs) {
        return {
          totalClubs: totalClubs || 0,
          activeClubs: 0,
          clubsBySize: { small: 0, medium: 0, large: 0 },
          topClubs: [],
        };
      }

      // Contar estudiantes por club
      const clubsWithCounts = await Promise.all(
        clubs.map(async (club) => {
          const { count: studentsCount } = await supabase
            .from("student_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id)
            .eq("status", "active");

          const { count: classesCount } = await supabase
            .from("programmed_classes")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id);

          return {
            id: club.id,
            name: club.name,
            studentsCount: studentsCount || 0,
            classesCount: classesCount || 0,
          };
        })
      );

      // Clasificar por tamaño
      const small = clubsWithCounts.filter((c) => c.studentsCount < 20).length;
      const medium = clubsWithCounts.filter((c) => c.studentsCount >= 20 && c.studentsCount <= 50).length;
      const large = clubsWithCounts.filter((c) => c.studentsCount > 50).length;

      // Top 5 clubes
      const topClubs = clubsWithCounts
        .sort((a, b) => b.studentsCount - a.studentsCount)
        .slice(0, 5);

      // Clubes activos (con al menos 1 estudiante)
      const activeClubs = clubsWithCounts.filter((c) => c.studentsCount > 0).length;

      return {
        totalClubs: totalClubs || 0,
        activeClubs,
        clubsBySize: { small, medium, large },
        topClubs,
      };
    },
    retry: false,
  });

  // Distribución de usuarios
  const { data: userDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ["advanced-user-distribution"],
    queryFn: async (): Promise<UserDistribution> => {
      // Por rol
      const { data: profiles } = await supabase
        .from("profiles")
        .select("role");

      const players = profiles?.filter((p) => p.role === "player").length || 0;
      const trainers = profiles?.filter((p) => p.role === "trainer").length || 0;
      const admins = profiles?.filter((p) => p.role === "admin" || p.role === "club_admin").length || 0;
      const owners = profiles?.filter((p) => p.role === "owner").length || 0;

      // Por nivel (solo players)
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("level")
        .eq("status", "active");

      const beginner = enrollments?.filter((e) => e.level >= 1 && e.level <= 3).length || 0;
      const intermediate = enrollments?.filter((e) => e.level >= 4 && e.level <= 6).length || 0;
      const advanced = enrollments?.filter((e) => e.level >= 7).length || 0;

      // Usuarios activos (con enrollments activos)
      const { count: totalActive } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      return {
        byRole: { players, trainers, admins, owners },
        byLevel: { beginner, intermediate, advanced },
        totalActive: totalActive || 0,
      };
    },
    retry: false,
  });

  return {
    growthMetrics,
    growthLoading,
    engagementMetrics,
    engagementLoading,
    clubMetrics,
    clubsLoading,
    userDistribution,
    distributionLoading,
  };
};
