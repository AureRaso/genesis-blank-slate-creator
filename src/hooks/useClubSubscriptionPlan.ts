/**
 * useClubSubscriptionPlan
 *
 * Hook para obtener el plan de suscripción correspondiente a un club
 * basado en el número de jugadores registrados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export const useClubSubscriptionPlan = (clubId: string | undefined): ClubSubscriptionPlanResult => {
  // Obtener el conteo de jugadores del club
  const { data: playerCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ["club-player-count", clubId],
    queryFn: async () => {
      if (!clubId) return 0;

      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("role", "player");

      if (error) {
        console.error("Error counting players:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!clubId,
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
  const recommendedPlan = allPlans.find(plan => plan.max_players >= playerCount)
    || allPlans[allPlans.length - 1]
    || null;

  return {
    playerCount,
    recommendedPlan,
    allPlans,
    isLoading: countLoading || plansLoading,
    error: error as Error | null,
  };
};