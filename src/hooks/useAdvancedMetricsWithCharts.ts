/**
 * useAdvancedMetricsWithCharts
 *
 * Hook mejorado con datos históricos para gráficos profesionales.
 * Incluye tendencias mensuales para visualización en charts.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyData {
  month: string;
  users: number;
  clubs: number;
  enrollments: number;
  classes: number;
  revenue: number;
}

interface GrowthMetrics {
  currentMonth: {
    newUsers: number;
    newClubs: number;
    newClasses: number;
  };
  lastMonth: {
    newUsers: number;
    newClubs: number;
    newClasses: number;
  };
  growth: {
    usersGrowth: number;
    clubsGrowth: number;
    classesGrowth: number;
  };
  monthlyTrend: MonthlyData[];
}

interface EngagementMetrics {
  totalClasses: number;
  totalParticipants: number;
  averageClassSize: number;
  classAttendanceRate: number;
  activeUsersLast30Days: number;
  weeklyActivity: Array<{
    week: string;
    classes: number;
    participants: number;
  }>;
}

interface ClubMetrics {
  totalClubs: number;
  activeClubs: number;
  clubsBySize: {
    small: number;
    medium: number;
    large: number;
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

export const useAdvancedMetricsWithCharts = (monthsRange: number = 6) => {
  // Métricas de crecimiento con tendencia mensual
  const { data: growthMetrics, isLoading: growthLoading } = useQuery({
    queryKey: ["advanced-growth-metrics-charts", monthsRange],
    queryFn: async (): Promise<GrowthMetrics> => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Datos del mes actual
      const { count: currentMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      const { count: lastMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      const { count: currentMonthClubs } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      const { count: lastMonthClubs } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      const { count: currentMonthClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentMonthStart.toISOString());

      const { count: lastMonthClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Calcular crecimiento
      const usersGrowth = lastMonthUsers
        ? ((currentMonthUsers! - lastMonthUsers) / lastMonthUsers) * 100
        : 0;
      const clubsGrowth = lastMonthClubs
        ? ((currentMonthClubs! - lastMonthClubs) / lastMonthClubs) * 100
        : 0;
      const classesGrowth = lastMonthClasses
        ? ((currentMonthClasses! - lastMonthClasses) / lastMonthClasses) * 100
        : 0;

      // Generar datos de los últimos N meses para el gráfico
      const monthlyTrend: MonthlyData[] = [];
      for (let i = monthsRange - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString("es-ES", { month: "short" });

        const { count: monthUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const { count: monthClubs } = await supabase
          .from("clubs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const { count: monthEnrollments } = await supabase
          .from("student_enrollments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const { count: monthClasses } = await supabase
          .from("programmed_classes")
          .select("*", { count: "exact", head: true })
          .gte("start_date", monthStart.toISOString().split("T")[0])
          .lte("start_date", monthEnd.toISOString().split("T")[0]);

        monthlyTrend.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          users: monthUsers || 0,
          clubs: monthClubs || 0,
          enrollments: monthEnrollments || 0,
          classes: monthClasses || 0,
          revenue: 0, // Placeholder
        });
      }

      return {
        currentMonth: {
          newUsers: currentMonthUsers || 0,
          newClubs: currentMonthClubs || 0,
          newClasses: currentMonthClasses || 0,
        },
        lastMonth: {
          newUsers: lastMonthUsers || 0,
          newClubs: lastMonthClubs || 0,
          newClasses: lastMonthClasses || 0,
        },
        growth: {
          usersGrowth: Number(usersGrowth.toFixed(1)),
          clubsGrowth: Number(clubsGrowth.toFixed(1)),
          classesGrowth: Number(classesGrowth.toFixed(1)),
        },
        monthlyTrend,
      };
    },
    retry: false,
    refetchInterval: 120000, // Refrescar cada 2 minutos
  });

  // Métricas de engagement con actividad semanal
  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery({
    queryKey: ["advanced-engagement-metrics-charts"],
    queryFn: async (): Promise<EngagementMetrics> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: totalClasses } = await supabase
        .from("programmed_classes")
        .select("*", { count: "exact", head: true })
        .gte("start_date", thirtyDaysAgo.toISOString().split("T")[0]);

      const { count: totalParticipants } = await supabase
        .from("class_participants")
        .select("*", { count: "exact", head: true });

      const averageClassSize = totalClasses && totalParticipants
        ? Math.round((totalParticipants / totalClasses) * 10) / 10
        : 0;

      const { count: confirmedAttendances } = await supabase
        .from("class_participants")
        .select("*", { count: "exact", head: true })
        .eq("attendance_confirmed", true);

      const classAttendanceRate = totalParticipants && confirmedAttendances
        ? Math.round((confirmedAttendances / totalParticipants) * 100)
        : 0;

      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Actividad semanal de las últimas 4 semanas
      const weeklyActivity = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const { count: weekClasses } = await supabase
          .from("programmed_classes")
          .select("*", { count: "exact", head: true })
          .gte("start_date", weekStart.toISOString().split("T")[0])
          .lte("start_date", weekEnd.toISOString().split("T")[0]);

        const { count: weekParticipants } = await supabase
          .from("class_participants")
          .select("*", { count: "exact", head: true });

        weeklyActivity.push({
          week: `S${4 - i}`,
          classes: weekClasses || 0,
          participants: weekParticipants || 0,
        });
      }

      return {
        totalClasses: totalClasses || 0,
        totalParticipants: totalParticipants || 0,
        averageClassSize,
        classAttendanceRate,
        activeUsersLast30Days: activeUsers || 0,
        weeklyActivity,
      };
    },
    retry: false,
  });

  // Métricas de clubes
  const { data: clubMetrics, isLoading: clubLoading } = useQuery({
    queryKey: ["advanced-club-metrics-charts"],
    queryFn: async (): Promise<ClubMetrics> => {
      const { data: clubs } = await supabase
        .from("clubs")
        .select("id, name, created_at");

      if (!clubs) {
        return {
          totalClubs: 0,
          activeClubs: 0,
          clubsBySize: { small: 0, medium: 0, large: 0 },
          topClubs: [],
        };
      }

      const clubsWithMetrics = await Promise.all(
        clubs.map(async (club) => {
          const { count: studentsCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id)
            .eq("role", "player");

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

      const clubsBySize = {
        small: clubsWithMetrics.filter((c) => c.studentsCount < 20).length,
        medium: clubsWithMetrics.filter((c) => c.studentsCount >= 20 && c.studentsCount < 50).length,
        large: clubsWithMetrics.filter((c) => c.studentsCount >= 50).length,
      };

      const topClubs = clubsWithMetrics
        .sort((a, b) => b.studentsCount - a.studentsCount)
        .slice(0, 5);

      return {
        totalClubs: clubs.length,
        activeClubs: clubsWithMetrics.filter((c) => c.studentsCount > 0).length,
        clubsBySize,
        topClubs,
      };
    },
    retry: false,
  });

  // Distribución de usuarios
  const { data: userDistribution, isLoading: userLoading } = useQuery({
    queryKey: ["advanced-user-distribution-charts"],
    queryFn: async (): Promise<UserDistribution> => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("role, level");

      if (!profiles) {
        return {
          byRole: { players: 0, trainers: 0, admins: 0, owners: 0 },
          byLevel: { beginner: 0, intermediate: 0, advanced: 0 },
          totalActive: 0,
        };
      }

      const byRole = {
        players: profiles.filter((p) => p.role === "player").length,
        trainers: profiles.filter((p) => p.role === "trainer").length,
        admins: profiles.filter((p) => p.role === "admin" || p.role === "club_admin").length,
        owners: profiles.filter((p) => p.role === "owner").length,
      };

      const byLevel = {
        beginner: profiles.filter((p) => p.level && p.level >= 1.0 && p.level < 4.0).length,
        intermediate: profiles.filter((p) => p.level && p.level >= 4.0 && p.level < 7.0).length,
        advanced: profiles.filter((p) => p.level && p.level >= 7.0 && p.level <= 10.0).length,
      };

      return {
        byRole,
        byLevel,
        totalActive: profiles.length,
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
    clubLoading,
    userDistribution,
    userLoading,
  };
};
