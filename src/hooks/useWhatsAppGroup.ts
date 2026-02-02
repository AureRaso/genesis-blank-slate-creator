import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppGroup } from "@/types/waitlist";

interface WhatsAppGroupData {
  id: string;
  group_chat_id: string;
  group_name: string;
  is_active: boolean;
  club_id: string | null;
  trainer_profile_id: string | null;
}

/**
 * Hook to get WhatsApp group for a specific club or trainer
 * If both clubId and trainerId are provided, it will prioritize the exact match
 * If only one is provided, it will search by that parameter
 */
export const useWhatsAppGroup = (clubId?: string, trainerId?: string) => {
  return useQuery({
    queryKey: ["whatsapp-group", clubId, trainerId],
    queryFn: async () => {
      let query = supabase
        .from("whatsapp_groups")
        .select("*")
        .eq("is_active", true);

      // If both are provided, try to find exact match first
      if (clubId && trainerId) {
        const { data, error } = await query
          .eq("club_id", clubId)
          .eq("trainer_profile_id", trainerId)
          .maybeSingle();

        if (error) throw error;
        if (data) return data as WhatsAppGroupData;

        // If no exact match, try club only
        const { data: clubData, error: clubError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("is_active", true)
          .eq("club_id", clubId)
          .maybeSingle();

        if (clubError) throw clubError;
        return clubData as WhatsAppGroupData | null;
      }

      // If only clubId is provided
      if (clubId) {
        query = query.eq("club_id", clubId);
      }

      // If only trainerId is provided
      if (trainerId) {
        query = query.eq("trainer_profile_id", trainerId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as WhatsAppGroupData | null;
    },
    enabled: !!(clubId || trainerId),
  });
};

/**
 * Hook to get ALL active WhatsApp groups for admins
 * Used when admin needs to select which group to notify
 * @param clubId - Optional club ID to filter groups by club
 * @param clubIds - Optional array of club IDs (for superadmin with "all clubs" selected)
 */
export const useAllWhatsAppGroups = (clubId?: string, clubIds?: string[]) => {
  return useQuery({
    queryKey: ["all-whatsapp-groups", clubId, clubIds],
    queryFn: async () => {
      let query = supabase
        .from("whatsapp_groups")
        .select("*")
        .eq("is_active", true);

      // Filter by single club_id if provided
      if (clubId) {
        query = query.eq("club_id", clubId);
      }
      // Filter by multiple club_ids for superadmin "all clubs" view
      else if (clubIds && clubIds.length > 0) {
        query = query.in("club_id", clubIds);
      }

      const { data, error } = await query.order("group_name", { ascending: true });

      if (error) {
        throw error;
      }

      // Remove duplicates by group_chat_id (same WhatsApp group in multiple clubs)
      const uniqueGroups = data?.reduce((acc, group) => {
        if (!acc.some(g => g.group_chat_id === group.group_chat_id)) {
          acc.push(group);
        }
        return acc;
      }, [] as typeof data) || [];

      return uniqueGroups as WhatsAppGroupData[];
    },
    enabled: !!(clubId || (clubIds && clubIds.length > 0)),
  });
};

/**
 * Hook to get the active WhatsApp group for the current user
 * Automatically detects if user is trainer or admin and fetches appropriate group
 */
export const useCurrentUserWhatsAppGroup = () => {
  return useQuery({
    queryKey: ["current-user-whatsapp-group"],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get user profile (including club_id for trainers)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, club_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // If trainer, get their WhatsApp group
      if (profile.role === "trainer") {
        // First try to get group by trainer profile
        const { data: trainerGroupData, error: trainerGroupError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("is_active", true)
          .eq("trainer_profile_id", profile.id)
          .maybeSingle();

        if (trainerGroupError) throw trainerGroupError;
        if (trainerGroupData) return trainerGroupData as WhatsAppGroupData;

        // Determine trainer's club_id - first from profile, then from trainer_clubs
        let trainerClubId = profile.club_id;

        if (!trainerClubId) {
          // Fallback: Get trainer's club through trainer_clubs junction table
          const { data: trainerClubData, error: trainerClubError } = await supabase
            .from("trainer_clubs")
            .select("club_id")
            .eq("trainer_profile_id", profile.id)
            .maybeSingle();

          if (trainerClubError) throw trainerClubError;
          trainerClubId = trainerClubData?.club_id;
        }

        // If we have a club_id, try to get group by club_id
        // FIX-2025-12-23: Un club puede tener múltiples grupos, tomamos el primero
        if (trainerClubId) {
          const { data: clubGroupData, error: clubGroupError } = await supabase
            .from("whatsapp_groups")
            .select("*")
            .eq("is_active", true)
            .eq("club_id", trainerClubId)
            .limit(1)
            .single();

          if (clubGroupError) throw clubGroupError;
          return clubGroupData as WhatsAppGroupData | null;
        }

        return null;
      }

      // If club admin, get their club's WhatsApp group
      if (profile.role === "club_admin") {
        const { data: clubAdminData, error: clubAdminError } = await supabase
          .from("club_admins")
          .select("club_id")
          .eq("profile_id", profile.id)
          .single();

        if (clubAdminError) throw clubAdminError;

        const { data: groupData, error: groupError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("is_active", true)
          .eq("club_id", clubAdminData.club_id)
          .maybeSingle();

        if (groupError) throw groupError;
        return groupData as WhatsAppGroupData | null;
      }

      // Admin - return first active group (or implement selection logic)
      if (profile.role === "admin") {
        const { data: groupData, error: groupError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (groupError) throw groupError;
        return groupData as WhatsAppGroupData | null;
      }

      // Superadmin - get groups from their assigned clubs via admin_clubs table
      if (profile.role === "superadmin") {
        // Get superadmin's assigned clubs
        const { data: adminClubs, error: adminClubsError } = await supabase
          .from("admin_clubs")
          .select("club_id")
          .eq("admin_profile_id", profile.id);

        if (adminClubsError) throw adminClubsError;

        if (!adminClubs || adminClubs.length === 0) {
          return null;
        }

        const clubIds = adminClubs.map(ac => ac.club_id);

        // Get first active WhatsApp group from their clubs
        const { data: groupData, error: groupError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("is_active", true)
          .in("club_id", clubIds)
          .limit(1)
          .maybeSingle();

        if (groupError) throw groupError;
        return groupData as WhatsAppGroupData | null;
      }

      return null;
    },
  });
};
