
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeagueTeams = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-teams', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching teams for league:', leagueId);
      const { data, error } = await supabase
        .from('league_teams')
        .select(`
          team_id,
          teams!league_teams_team_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (
              id,
              full_name,
              email
            ),
            player2:profiles!teams_player2_id_fkey (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('league_id', leagueId);

      if (error) {
        console.error('Error fetching league teams:', error);
        throw error;
      }

      console.log('League teams fetched:', data);
      return data;
    },
    enabled: !!leagueId,
  });
};
