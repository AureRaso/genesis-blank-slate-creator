
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePlayerLeagues = (profileId?: string) => {
  return useQuery({
    queryKey: ['player-leagues', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      console.log('Fetching leagues for player:', profileId);
      
      const { data, error } = await supabase
        .from('league_players')
        .select(`
          status,
          leagues:league_id (
            id,
            name,
            status,
            start_date,
            end_date,
            points_victory,
            points_defeat,
            registration_price
          )
        `)
        .eq('profile_id', profileId)
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching player leagues:', error);
        throw error;
      }

      console.log('Player leagues fetched:', data);
      return data?.map(item => item.leagues).filter(Boolean) || [];
    },
    enabled: !!profileId,
  });
};
