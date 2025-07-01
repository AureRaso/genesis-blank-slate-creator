
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Club = {
  id: string;
  name: string;
  address: string;
  phone: string;
  court_count: number;
  court_types: string[];
  description?: string;
  created_by_profile_id: string;
  created_at: string;
  updated_at: string;
};

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      console.log('Fetching clubs...');
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clubs:', error);
        throw error;
      }
      
      console.log('Clubs fetched:', data);
      return data as Club[];
    },
  });
};
