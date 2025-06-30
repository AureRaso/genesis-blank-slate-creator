
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
      
      // Get all teams in the league - simplified query
      const { data: leagueTeamsData, error: leagueTeamsError } = await supabase
        .from('league_teams')
        .select('team_id')
        .eq('league_id', leagueId);

      if (leagueTeamsError) {
        console.error('Error fetching league teams:', leagueTeamsError);
        throw leagueTeamsError;
      }

      if (!leagueTeamsData || leagueTeamsData.length === 0) {
        return [];
      }

      const teamIds = leagueTeamsData.map(lt => lt.team_id);

      // Get teams data separately
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, player1_id, player2_id')
        .in('id', teamIds);

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      // Get all unique player IDs
      const playerIds = new Set<string>();
      teamsData?.forEach(team => {
        if (team.player1_id) playerIds.add(team.player1_id);
        if (team.player2_id) playerIds.add(team.player2_id);
      });

      // Get player profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(playerIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
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

      console.log('Matches with results:', matches);

      // Create maps for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Calculate standings
      const standings: Record<string, TeamStanding> = {};

      // Initialize standings for all teams
      teamsData?.forEach(team => {
        const player1 = profilesMap.get(team.player1_id);
        const player2 = profilesMap.get(team.player2_id);
        
        standings[team.id] = {
          team_id: team.id,
          team_name: team.name,
          player1_name: player1?.full_name || 'Jugador 1',
          player2_name: player2?.full_name || 'Jugador 2',
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

        console.log('Processing match result:', {
          match_id: match.id,
          team1Id,
          team2Id,
          result
        });

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
