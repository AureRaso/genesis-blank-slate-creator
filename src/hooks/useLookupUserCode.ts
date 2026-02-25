import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserCodeResult {
  id: string;
  full_name: string;
  email: string;
  user_code: string;
}

export const useLookupUserCode = (code: string, clubId?: string) => {
  const normalizedCode = code.toUpperCase().trim();

  return useQuery({
    queryKey: ["lookup-user-code", normalizedCode, clubId],
    queryFn: async (): Promise<UserCodeResult | null> => {
      const { data, error } = await supabase.rpc("lookup_user_by_code", {
        p_code: normalizedCode,
        p_club_id: clubId || null,
      });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as UserCodeResult;
    },
    enabled: !!normalizedCode && normalizedCode.length === 6,
  });
};
