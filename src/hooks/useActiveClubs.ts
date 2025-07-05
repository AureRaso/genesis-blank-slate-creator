
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useActiveClubs = () => {
  return useQuery({
    queryKey: ['active-clubs'],
    queryFn: async () => {
      console.log('useActiveClubs - Starting query...');
      
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      console.log('useActiveClubs - Query result:', { 
        dataCount: data?.length || 0, 
        error: error?.message 
      });
      
      if (error) {
        console.error('Error fetching active clubs:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};
