
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamStanding {
  team_id: string;
  team_name: string;
  player1_name: string;
  player2_name: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  points: number;
}

export const useLeagueStandings = (leagueId: string) => {
  return useQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching league standings for:', leagueId);
      
      // Get all teams in the league
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('league_teams')
        .select(`
          team_id,
          teams!league_teams_team_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (
              id,
              full_name
            ),
            player2:profiles!teams_player2_id_fkey (
              id,
              full_name
            )
          )
        `)
        .eq('league_id', leagueId);

      if (teamsError) {
        console.error('Error fetching league teams:', teamsError);
        throw teamsError;
      }

      // Get all completed matches for this league
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

      // Calculate standings
      const standings: Record<string, TeamStanding> = {};

      // Initialize standings for all teams
      leagueTeams?.forEach(lt => {
        const team = lt.teams;
        if (!team) return;
        
        standings[team.id] = {
          team_id: team.id,
          team_name: team.name,
          player1_name: team.player1?.[0]?.full_name || 'Jugador 1',
          player2_name: team.player2?.[0]?.full_name || 'Jugador 2',
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          sets_won: 0,
          sets_lost: 0,
          games_won: 0,
          games_lost: 0,
          points: 0,
        };
      });

      // Process completed matches
      matches?.forEach(match => {
        if (!match.match_results || !Array.isArray(match.match_results) || match.match_results.length === 0) return;
        
        const result = match.match_results[0];
        const team1Id = match.team1_id;
        const team2Id = match.team2_id;

        if (standings[team1Id] && standings[team2Id]) {
          // Update matches played
          standings[team1Id].matches_played++;
          standings[team2Id].matches_played++;

          // Calculate sets
          const team1Sets = [
            result.team1_set1 > result.team2_set1 ? 1 : 0,
            result.team1_set2 > result.team2_set2 ? 1 : 0,
            result.team1_set3 && result.team2_set3 ? (result.team1_set3 > result.team2_set3 ? 1 : 0) : 0
          ].reduce((a, b) => a + b, 0);

          const team2Sets = [
            result.team2_set1 > result.team1_set1 ? 1 : 0,
            result.team2_set2 > result.team1_set2 ? 1 : 0,
            result.team2_set3 && result.team1_set3 ? (result.team2_set3 > result.team1_set3 ? 1 : 0) : 0
          ].reduce((a, b) => a + b, 0);

          // Update sets
          standings[team1Id].sets_won += team1Sets;
          standings[team1Id].sets_lost += team2Sets;
          standings[team2Id].sets_won += team2Sets;
          standings[team2Id].sets_lost += team1Sets;

          // Update games
          standings[team1Id].games_won += (result.team1_set1 + result.team1_set2 + (result.team1_set3 || 0));
          standings[team1Id].games_lost += (result.team2_set1 + result.team2_set2 + (result.team2_set3 || 0));
          standings[team2Id].games_won += (result.team2_set1 + result.team2_set2 + (result.team2_set3 || 0));
          standings[team2Id].games_lost += (result.team1_set1 + result.team1_set2 + (result.team1_set3 || 0));

          // Update matches won/lost and points
          if (team1Sets > team2Sets) {
            standings[team1Id].matches_won++;
            standings[team2Id].matches_lost++;
            standings[team1Id].points += result.points_team1 || 3;
            standings[team2Id].points += result.points_team2 || 0;
          } else {
            standings[team2Id].matches_won++;
            standings[team1Id].matches_lost++;
            standings[team2Id].points += result.points_team2 || 3;
            standings[team1Id].points += result.points_team1 || 0;
          }
        }
      });

      // Convert to array and sort by points
      const standingsArray = Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
        if (b.sets_won !== a.sets_won) return b.sets_won - a.sets_won;
        return b.games_won - a.games_won;
      });

      console.log('League standings calculated:', standingsArray);
      return standingsArray;
    },
    enabled: !!leagueId,
  });
};
