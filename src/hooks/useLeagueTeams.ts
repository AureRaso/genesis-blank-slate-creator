
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeagueTeams = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-teams', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching teams for league:', leagueId);
      
      // First get the team IDs from league_teams
      const { data: leagueTeamData, error: leagueError } = await supabase
        .from('league_teams')
        .select('team_id')
        .eq('league_id', leagueId);

      if (leagueError) {
        console.error('Error fetching league team IDs:', leagueError);
        throw leagueError;
      }

      if (!leagueTeamData || leagueTeamData.length === 0) {
        console.log('No teams found in league');
        return [];
      }

      const teamIds = leagueTeamData.map(lt => lt.team_id);
      
      // Then get the teams with their player information
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          player1_id,
          player2_id
        `)
        .in('id', teamIds);

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      // Now get the profiles for all players
      const allPlayerIds = new Set<string>();
      teamsData?.forEach(team => {
        if (team.player1_id) allPlayerIds.add(team.player1_id);
        if (team.player2_id) allPlayerIds.add(team.player2_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', Array.from(allPlayerIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create a map for quick profile lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine teams with their player information
      const result = teamsData?.map(team => ({
        team_id: team.id,
        teams: {
          id: team.id,
          name: team.name,
          player1_id: team.player1_id,
          player2_id: team.player2_id,
          player1: profilesMap.get(team.player1_id) || null,
          player2: profilesMap.get(team.player2_id) || null,
        }
      })) || [];

      console.log('League teams fetched successfully:', result);
      return result;
    },
    enabled: !!leagueId,
  });
};
