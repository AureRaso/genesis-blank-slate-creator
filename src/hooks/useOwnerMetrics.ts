/**
 * useOwnerMetrics
 *
 * Hook para obtener métricas y estadísticas del sistema para el panel de owner.
 * IMPORTANTE: Este hook SOLO debe usarse en el OwnerDashboard.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OwnerMetrics {
  totalClubs: number;
  totalUsers: number;
  totalTrainers: number;
  totalPlayers: number;
  totalAdmins: number;
  classesToday: number;
  activeEnrollments: number;
  totalRevenue: number;
}

interface Club {
  id: string;
  name: string;
  created_at: string;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  club_id: string | null;
}

export const useOwnerMetrics = () => {
  // Obtener métricas generales
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["owner-metrics"],
    queryFn: async (): Promise<OwnerMetrics> => {
      // Contar clubes (con manejo de errores)
      let clubsCount = 0;
      try {
        const { count } = await supabase
          .from("clubs")
          .select("*", { count: "exact", head: true });
        clubsCount = count || 0;
      } catch (error) {
        console.warn("Error fetching clubs count:", error);
      }

      // Contar usuarios por rol
      const { data: profiles } = await supabase
        .from("profiles")
        .select("role");

      const totalUsers = profiles?.length || 0;
      const totalTrainers = profiles?.filter(p => p.role === "trainer").length || 0;
      const totalPlayers = profiles?.filter(p => p.role === "player").length || 0;
      const totalAdmins = profiles?.filter(p => p.role === "admin" || p.role === "club_admin").length || 0;

      // Contar clases de hoy (con manejo de errores)
      let todayClassesCount = 0;
      try {
        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase
          .from("programmed_classes")
          .select("*", { count: "exact", head: true })
          .eq("start_date", today);
        todayClassesCount = count || 0;
      } catch (error) {
        console.warn("Error fetching today's classes count:", error);
      }

      // Contar enrollments activos
      const { count: enrollmentsCount } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Calcular revenue total (con manejo de errores - tabla puede no existir)
      let totalRevenue = 0;
      try {
        const { data: payments } = await supabase
          .from("payment_records")
          .select("amount");
        totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      } catch (error) {
        console.warn("Error fetching payment records:", error);
      }

      return {
        totalClubs: clubsCount,
        totalUsers,
        totalTrainers,
        totalPlayers,
        totalAdmins,
        classesToday: todayClassesCount,
        activeEnrollments: enrollmentsCount || 0,
        totalRevenue,
      };
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    retry: false, // No reintentar en caso de error
  });

  // Obtener lista de clubes (con manejo de errores - solo columnas que existen)
  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ["owner-clubs"],
    queryFn: async (): Promise<Club[]> => {
      try {
        const { data, error } = await supabase
          .from("clubs")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.warn("Error fetching clubs:", error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn("Error fetching clubs:", error);
        return [];
      }
    },
    retry: false,
  });

  // Obtener usuarios recientes
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["owner-recent-users"],
    queryFn: async (): Promise<RecentUser[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at, club_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  return {
    metrics,
    metricsLoading,
    clubs,
    clubsLoading,
    recentUsers,
    usersLoading,
  };
};
