
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeagueStanding } from '@/types/padel';

export const useLeagueStandings = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching standings for league:', leagueId);
      
      // Get all teams in the league with their match results
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('league_teams')
        .select(`
          team:teams (
            id,
            name,
            player1:players!teams_player1_id_fkey (id, name),
            player2:players!teams_player2_id_fkey (id, name)
          )
        `)
        .eq('league_id', leagueId);

      if (teamsError) {
        console.error('Error fetching league teams:', teamsError);
        throw teamsError;
      }

      if (!leagueTeams || leagueTeams.length === 0) {
        return [];
      }

      // Get all matches and results for this league
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          match_results (*)
        `)
        .eq('league_id', leagueId)
        .eq('status', 'completed');

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        throw matchesError;
      }

      // Calculate standings for each team
      const standings: LeagueStanding[] = leagueTeams.map((lt) => {
        const team = lt.team;
        if (!team) return null;

        let matches_played = 0;
        let matches_won = 0;
        let matches_lost = 0;
        let sets_for = 0;
        let sets_against = 0;
        let total_points = 0;

        // Find all matches for this team
        const teamMatches = matches?.filter(match => 
          match.team1_id === team.id || match.team2_id === team.id
        ) || [];

        teamMatches.forEach(match => {
          const result = match.match_results?.[0];
          if (!result) return;

          matches_played++;
          const isTeam1 = match.team1_id === team.id;

          // Count sets
          const team_set1 = isTeam1 ? result.team1_set1 : result.team2_set1;
          const team_set2 = isTeam1 ? result.team1_set2 : result.team2_set2;
          const team_set3 = isTeam1 ? result.team1_set3 : result.team2_set3;
          
          const opponent_set1 = isTeam1 ? result.team2_set1 : result.team1_set1;
          const opponent_set2 = isTeam1 ? result.team2_set2 : result.team1_set2;
          const opponent_set3 = isTeam1 ? result.team2_set3 : result.team1_set3;

          // Calculate sets won/lost
          let team_sets_won = 0;
          let opponent_sets_won = 0;

          if (team_set1 > opponent_set1) team_sets_won++; else opponent_sets_won++;
          if (team_set2 > opponent_set2) team_sets_won++; else opponent_sets_won++;
          if (team_set3 !== null && opponent_set3 !== null) {
            if (team_set3 > opponent_set3) team_sets_won++; else opponent_sets_won++;
          }

          sets_for += team_sets_won;
          sets_against += opponent_sets_won;

          // Determine if won or lost
          if (result.winner_team_id === team.id) {
            matches_won++;
          } else {
            matches_lost++;
          }

          // Add points
          const team_points = isTeam1 ? result.points_team1 : result.points_team2;
          total_points += team_points;
        });

        return {
          team_id: team.id,
          team_name: team.name,
          player1_name: team.player1?.name || '',
          player2_name: team.player2?.name || '',
          matches_played,
          matches_won,
          matches_lost,
          sets_for,
          sets_against,
          set_difference: sets_for - sets_against,
          total_points,
          position: 0, // Will be calculated after sorting
        };
      }).filter(Boolean) as LeagueStanding[];

      // Sort by points (desc), then by set difference (desc), then by sets for (desc)
      standings.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        if (b.set_difference !== a.set_difference) {
          return b.set_difference - a.set_difference;
        }
        return b.sets_for - a.sets_for;
      });

      // Assign positions
      standings.forEach((standing, index) => {
        standing.position = index + 1;
      });

      console.log('Standings calculated:', standings);
      return standings;
    },
    enabled: !!leagueId,
  });
};
