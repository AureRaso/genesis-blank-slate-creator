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
  // Usa paginación para superar el límite de 1000 filas de Supabase
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["owner-users-management"],
    queryFn: async (): Promise<UserDetail[]> => {
      try {
        // Primero obtener el total de usuarios
        const { count: totalCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        if (!totalCount || totalCount === 0) {
          return [];
        }

        // Obtener todos los perfiles usando paginación (1000 por página)
        const pageSize = 1000;
        const totalPages = Math.ceil(totalCount / pageSize);
        let allProfiles: any[] = [];

        for (let page = 0; page < totalPages; page++) {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          const { data: pageData, error: pageError } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, club_id, created_at, level")
            .order("created_at", { ascending: false })
            .range(from, to);

          if (pageError) {
            console.warn(`Error fetching profiles page ${page}:`, pageError);
            continue;
          }

          if (pageData) {
            allProfiles = [...allProfiles, ...pageData];
          }
        }

        if (allProfiles.length === 0) {
          return [];
        }

        // Obtener información de clubes
        const clubIds = [...new Set(allProfiles.map(p => p.club_id).filter(Boolean))];
        const { data: clubsData } = await supabase
          .from("clubs")
          .select("id, name")
          .in("id", clubIds);

        const clubsMap = new Map(clubsData?.map(c => [c.id, c.name]) || []);

        // Obtener last_sign_in_at de auth.users (si tenemos acceso)
        // Nota: esto puede requerir permisos especiales, lo dejamos opcional
        const usersWithClubNames: UserDetail[] = allProfiles.map(profile => ({
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
    refetchOnWindowFocus: true, // Refrescar cuando el usuario vuelve a la pestaña
    retry: false,
  });

  // Estadísticas de usuarios - usando count para evitar el límite de 1000 filas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["owner-users-stats"],
    queryFn: async (): Promise<UserStats> => {
      try {
        // Contar total de usuarios usando count: exact
        const { count: totalUsersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Contar por rol usando count: exact
        const { count: playersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "player");

        const { count: trainersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "trainer");

        const { count: adminsCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .in("role", ["admin", "club_admin"]);

        const { count: ownersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "owner");

        // Nuevos usuarios este mes
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const { count: newUsersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentMonthStart.toISOString());

        // Usuarios activos esta semana (basado en created_at reciente como aproximación)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: activeUsersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneWeekAgo.toISOString());

        return {
          totalUsers: totalUsersCount || 0,
          totalPlayers: playersCount || 0,
          totalTrainers: trainersCount || 0,
          totalAdmins: adminsCount || 0,
          totalOwners: ownersCount || 0,
          newUsersThisMonth: newUsersCount || 0,
          activeUsersThisWeek: activeUsersCount || 0,
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
    retry: false,
  });

  return {
    users: users || [],
    usersLoading,
    stats,
    statsLoading,
  };
};
