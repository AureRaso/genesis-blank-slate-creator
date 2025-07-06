
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { League } from '@/types/padel';

interface PlayerLeagueStatus {
  availableLeagues: League[];
  enrolledLeagues: League[];
  isLoading: boolean;
}

export const usePlayerAvailableLeagues = (profileId?: string, clubId?: string): PlayerLeagueStatus => {
  return useQuery({
    queryKey: ['player-available-leagues', profileId, clubId],
    queryFn: async () => {
      if (!profileId || !clubId) {
        return { availableLeagues: [], enrolledLeagues: [] };
      }

      console.log('Fetching available and enrolled leagues for player:', profileId, 'club:', clubId);

      // Get all leagues from player's club
      const { data: allClubLeagues, error: clubLeaguesError } = await supabase
        .from('leagues')
        .select(`
          *,
          clubs (
            id,
            name,
            address,
            phone
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (clubLeaguesError) {
        console.error('Error fetching club leagues:', clubLeaguesError);
        throw clubLeaguesError;
      }

      // Get player's enrolled leagues
      const { data: playerRegistrations, error: registrationsError } = await supabase
        .from('league_players')
        .select('league_id, status')
        .eq('profile_id', profileId)
        .eq('status', 'approved');

      if (registrationsError) {
        console.error('Error fetching player registrations:', registrationsError);
        throw registrationsError;
      }

      const enrolledLeagueIds = playerRegistrations?.map(reg => reg.league_id) || [];
      
      const enrolledLeagues = allClubLeagues?.filter(league => 
        enrolledLeagueIds.includes(league.id)
      ) || [];

      const availableLeagues = allClubLeagues?.filter(league => 
        !enrolledLeagueIds.includes(league.id) && league.status !== 'completed'
      ) || [];

      console.log('Available leagues:', availableLeagues.length, 'Enrolled leagues:', enrolledLeagues.length);

      return {
        availableLeagues: availableLeagues as League[],
        enrolledLeagues: enrolledLeagues as League[]
      };
    },
    enabled: !!profileId && !!clubId,
  });
};
