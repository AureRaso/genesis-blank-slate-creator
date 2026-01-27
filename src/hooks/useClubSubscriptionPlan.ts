/**
 * useClubSubscriptionPlan
 *
 * Hook para obtener el plan de suscripción correspondiente a un club
 * basado en el número de jugadores registrados.
 * Para superadmins, cuenta jugadores de todos sus clubes asignados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionPlan {
  id: string;
  name: string;
  max_players: number;
  price_monthly: number;
  stripe_price_id: string;
  stripe_product_id: string;
  is_active: boolean;
  created_at: string;
}

interface ClubSubscriptionPlanResult {
  playerCount: number;
  recommendedPlan: SubscriptionPlan | null;
  allPlans: SubscriptionPlan[];
  isLoading: boolean;
  error: Error | null;
  clubCount?: number;
}

export const useClubSubscriptionPlan = (clubId: string | undefined): ClubSubscriptionPlanResult => {
  const { profile } = useAuth();
  const isSuperadmin = profile?.role === 'superadmin';

  // Obtener el conteo de jugadores
  // Para superadmin: cuenta de todos sus clubes
  // Para admin: cuenta solo de su club
  const { data: playerData = { count: 0, clubCount: 0 }, isLoading: countLoading } = useQuery({
    queryKey: ["club-player-count", clubId, isSuperadmin, profile?.id],
    queryFn: async () => {
      if (isSuperadmin && profile?.id) {
        // Superadmin: obtener todos los club_ids de admin_clubs
        const { data: adminClubs, error: adminClubsError } = await supabase
          .from("admin_clubs")
          .select("club_id")
          .eq("admin_profile_id", profile.id);

        if (adminClubsError) {
          console.error("Error fetching admin clubs:", adminClubsError);
          return { count: 0, clubCount: 0 };
        }

        if (!adminClubs || adminClubs.length === 0) {
          return { count: 0, clubCount: 0 };
        }

        const clubIds = adminClubs.map(ac => ac.club_id);

        // Contar jugadores de todos los clubes
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .in("club_id", clubIds)
          .eq("role", "player");

        if (error) {
          console.error("Error counting players for superadmin:", error);
          return { count: 0, clubCount: clubIds.length };
        }

        return { count: count || 0, clubCount: clubIds.length };
      } else {
        // Admin normal: contar solo de su club
        if (!clubId) return { count: 0, clubCount: 1 };

        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("club_id", clubId)
          .eq("role", "player");

        if (error) {
          console.error("Error counting players:", error);
          return { count: 0, clubCount: 1 };
        }

        return { count: count || 0, clubCount: 1 };
      }
    },
    enabled: !!clubId || isSuperadmin,
  });

  // Obtener todos los planes de suscripción
  const { data: allPlans = [], isLoading: plansLoading, error } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("max_players", { ascending: true });

      if (error) {
        console.error("Error fetching subscription plans:", error);
        throw error;
      }

      return data as SubscriptionPlan[];
    },
  });

  // Determinar el plan recomendado basado en el número de jugadores
  const recommendedPlan = allPlans.find(plan => plan.max_players >= playerData.count)
    || allPlans[allPlans.length - 1]
    || null;

  return {
    playerCount: playerData.count,
    recommendedPlan,
    allPlans,
    isLoading: countLoading || plansLoading,
    error: error as Error | null,
    clubCount: playerData.clubCount,
  };
};