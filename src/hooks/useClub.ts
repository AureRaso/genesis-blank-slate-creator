
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useClub = (clubId?: string) => {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      if (!clubId) return null;
      
      console.log('Fetching club by id:', clubId);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) {
        console.error('Error fetching club:', error);
        throw error;
      }
      
      console.log('Club fetched:', data);
      return data;
    },
    enabled: !!clubId,
  });
};
