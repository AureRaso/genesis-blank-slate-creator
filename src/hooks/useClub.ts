
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useClub = (clubId?: string) => {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      if (!clubId) return null;

      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!clubId,
  });
};
