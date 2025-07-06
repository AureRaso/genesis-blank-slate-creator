
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { League } from '@/types/padel';

interface PlayerLeagueStatus {
  availableLeagues: League[];
  enrolledLeagues: League[];
  pendingLeagues: League[];
  isLoading: boolean;
}

export const usePlayerAvailableLeagues = (profileId?: string, clubId?: string): PlayerLeagueStatus => {
  const { data, isLoading } = useQuery({
    queryKey: ['player-available-leagues', profileId, clubId],
    queryFn: async () => {
      if (!profileId || !clubId) {
        return { availableLeagues: [], enrolledLeagues: [], pendingLeagues: [] };
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

      // Get player's league registrations with all statuses
      const { data: playerRegistrations, error: registrationsError } = await supabase
        .from('league_players')
        .select('league_id, status')
        .eq('profile_id', profileId);

      if (registrationsError) {
        console.error('Error fetching player registrations:', registrationsError);
        throw registrationsError;
      }

      const registrationMap = new Map(
        playerRegistrations?.map(reg => [reg.league_id, reg.status]) || []
      );

      const enrolledLeagues = allClubLeagues?.filter(league => 
        registrationMap.get(league.id) === 'approved'
      ) || [];

      const pendingLeagues = allClubLeagues?.filter(league => 
        registrationMap.get(league.id) === 'pending'
      ) || [];

      const availableLeagues = allClubLeagues?.filter(league => 
        !registrationMap.has(league.id) && league.status !== 'completed'
      ) || [];

      console.log('Available leagues:', availableLeagues.length, 'Enrolled leagues:', enrolledLeagues.length, 'Pending leagues:', pendingLeagues.length);

      return {
        availableLeagues: availableLeagues as League[],
        enrolledLeagues: enrolledLeagues as League[],
        pendingLeagues: pendingLeagues as League[]
      };
    },
    enabled: !!profileId && !!clubId,
  });

  return {
    availableLeagues: data?.availableLeagues || [],
    enrolledLeagues: data?.enrolledLeagues || [],
    pendingLeagues: data?.pendingLeagues || [],
    isLoading
  };
};
