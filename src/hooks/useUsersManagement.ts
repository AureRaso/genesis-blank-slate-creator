/**
 * useUsersManagement
 *
 * Hook para gestión completa de usuarios desde el panel de owner.
 * Incluye filtros por rol, club, búsqueda y estadísticas.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserDetail {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  club_id: string | null;
  club_name?: string;
  level?: number | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export interface UserStats {
  totalUsers: number;
  totalPlayers: number;
  totalTrainers: number;
  totalAdmins: number;
  totalOwners: number;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
}

export const useUsersManagement = () => {
  // Obtener lista completa de usuarios con información de club
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["owner-users-management"],
    queryFn: async (): Promise<UserDetail[]> => {
      try {
        // Obtener todos los perfiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, club_id, created_at, level")
          .order("created_at", { ascending: false });

        if (profilesError) {
          console.warn("Error fetching profiles:", profilesError);
          return [];
        }

        if (!profilesData || profilesData.length === 0) {
          return [];
        }

        // Obtener información de clubes
        const clubIds = [...new Set(profilesData.map(p => p.club_id).filter(Boolean))];
        const { data: clubsData } = await supabase
          .from("clubs")
          .select("id, name")
          .in("id", clubIds);

        const clubsMap = new Map(clubsData?.map(c => [c.id, c.name]) || []);

        // Obtener last_sign_in_at de auth.users (si tenemos acceso)
        // Nota: esto puede requerir permisos especiales, lo dejamos opcional
        const usersWithClubNames: UserDetail[] = profilesData.map(profile => ({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          club_id: profile.club_id,
          club_name: profile.club_id ? clubsMap.get(profile.club_id) : undefined,
          level: profile.level,
          created_at: profile.created_at,
          last_sign_in_at: null, // No tenemos acceso directo a auth.users
        }));

        return usersWithClubNames;
      } catch (error) {
        console.warn("Error in useUsersManagement:", error);
        return [];
      }
    },
    refetchInterval: 60000, // Refrescar cada minuto
    retry: false,
  });

  // Estadísticas de usuarios
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["owner-users-stats"],
    queryFn: async (): Promise<UserStats> => {
      try {
        const totalUsers = users?.length || 0;
        const totalPlayers = users?.filter(u => u.role === "player").length || 0;
        const totalTrainers = users?.filter(u => u.role === "trainer").length || 0;
        const totalAdmins = users?.filter(u => u.role === "admin" || u.role === "club_admin").length || 0;
        const totalOwners = users?.filter(u => u.role === "owner").length || 0;

        // Nuevos usuarios este mes
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const newUsersThisMonth = users?.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= currentMonthStart;
        }).length || 0;

        // Usuarios activos esta semana (basado en created_at reciente como aproximación)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const activeUsersThisWeek = users?.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= oneWeekAgo;
        }).length || 0;

        return {
          totalUsers,
          totalPlayers,
          totalTrainers,
          totalAdmins,
          totalOwners,
          newUsersThisMonth,
          activeUsersThisWeek,
        };
      } catch (error) {
        console.warn("Error calculating user stats:", error);
        return {
          totalUsers: 0,
          totalPlayers: 0,
          totalTrainers: 0,
          totalAdmins: 0,
          totalOwners: 0,
          newUsersThisMonth: 0,
          activeUsersThisWeek: 0,
        };
      }
    },
    enabled: !!users && users.length > 0,
    retry: false,
  });

  return {
    users: users || [],
    usersLoading,
    stats,
    statsLoading,
  };
};
