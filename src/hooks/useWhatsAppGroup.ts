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
 */
export const useAllWhatsAppGroups = () => {
  return useQuery({
    queryKey: ["all-whatsapp-groups"],
    queryFn: async () => {
      console.log('📱 Fetching all WhatsApp groups...');

      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("*")
        .eq("is_active", true)
        .order("group_name", { ascending: true });

      if (error) {
        console.error('❌ Error fetching groups:', error);
        throw error;
      }

      console.log('✅ WhatsApp groups fetched:', data?.length, 'groups');
      console.log('📋 Groups:', data);

      return data as WhatsAppGroupData[];
    },
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

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // If trainer, get their WhatsApp group
      if (profile.role === "trainer") {
        // Get trainer's club through trainer_clubs junction table
        const { data: trainerClubData, error: trainerClubError } = await supabase
          .from("trainer_clubs")
          .select("club_id")
          .eq("trainer_profile_id", profile.id)
          .maybeSingle();

        if (trainerClubError) throw trainerClubError;

        // Try to get group by trainer profile first, then by club
        const { data: groupData, error: groupError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("is_active", true)
          .or(`trainer_profile_id.eq.${profile.id}${trainerClubData?.club_id ? `,club_id.eq.${trainerClubData.club_id}` : ''}`)
          .limit(1)
          .maybeSingle();

        if (groupError) throw groupError;
        return groupData as WhatsAppGroupData | null;
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

      // Super admin - return first active group (or implement selection logic)
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

      return null;
    },
  });
};
