
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerStanding {
  player_id: string;
  player_name: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  points: number;
  win_percentage: number;
}

export const usePlayerStandings = (leagueId: string) => {
  return useQuery({
    queryKey: ['player-standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching player standings for:', leagueId);
      
      // Get all teams in the league with their players
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('league_teams')
        .select(`
          team_id,
          teams!league_teams_team_id_fkey (
            id,
            name,
            player1_id,
            player2_id,
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

      // Create a map of players
      const playersMap: Record<string, PlayerStanding> = {};
      
      // Initialize all players
      leagueTeams?.forEach(lt => {
        const team = lt.teams;
        if (!team) return;
        
        // Add player1
        if (team.player1?.[0]) {
          const player = team.player1[0];
          if (!playersMap[player.id]) {
            playersMap[player.id] = {
              player_id: player.id,
              player_name: player.full_name,
              matches_played: 0,
              matches_won: 0,
              matches_lost: 0,
              sets_won: 0,
              sets_lost: 0,
              games_won: 0,
              games_lost: 0,
              points: 0,
              win_percentage: 0,
            };
          }
        }
        
        // Add player2
        if (team.player2?.[0]) {
          const player = team.player2[0];
          if (!playersMap[player.id]) {
            playersMap[player.id] = {
              player_id: player.id,
              player_name: player.full_name,
              matches_played: 0,
              matches_won: 0,
              matches_lost: 0,
              sets_won: 0,
              sets_lost: 0,
              games_won: 0,
              games_lost: 0,
              points: 0,
              win_percentage: 0,
            };
          }
        }
      });

      // Create team to players mapping
      const teamPlayersMap: Record<string, string[]> = {};
      leagueTeams?.forEach(lt => {
        const team = lt.teams;
        if (!team) return;
        
        teamPlayersMap[team.id] = [
          team.player1?.[0]?.id,
          team.player2?.[0]?.id
        ].filter(Boolean);
      });

      // Process completed matches
      matches?.forEach(match => {
        if (!match.match_results || !Array.isArray(match.match_results) || match.match_results.length === 0) return;
        
        const result = match.match_results[0];
        const team1Players = teamPlayersMap[match.team1_id] || [];
        const team2Players = teamPlayersMap[match.team2_id] || [];

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

        const team1Games = result.team1_set1 + result.team1_set2 + (result.team1_set3 || 0);
        const team2Games = result.team2_set1 + result.team2_set2 + (result.team2_set3 || 0);

        // Update team1 players
        team1Players.forEach(playerId => {
          if (playersMap[playerId]) {
            playersMap[playerId].matches_played++;
            playersMap[playerId].sets_won += team1Sets;
            playersMap[playerId].sets_lost += team2Sets;
            playersMap[playerId].games_won += team1Games;
            playersMap[playerId].games_lost += team2Games;
            
            if (team1Sets > team2Sets) {
              playersMap[playerId].matches_won++;
              playersMap[playerId].points += result.points_team1 || 3;
            } else {
              playersMap[playerId].matches_lost++;
              playersMap[playerId].points += result.points_team1 || 0;
            }
          }
        });

        // Update team2 players
        team2Players.forEach(playerId => {
          if (playersMap[playerId]) {
            playersMap[playerId].matches_played++;
            playersMap[playerId].sets_won += team2Sets;
            playersMap[playerId].sets_lost += team1Sets;
            playersMap[playerId].games_won += team2Games;
            playersMap[playerId].games_lost += team1Games;
            
            if (team2Sets > team1Sets) {
              playersMap[playerId].matches_won++;
              playersMap[playerId].points += result.points_team2 || 3;
            } else {
              playersMap[playerId].matches_lost++;
              playersMap[playerId].points += result.points_team2 || 0;
            }
          }
        });
      });

      // Calculate win percentages and convert to array
      const standingsArray = Object.values(playersMap).map(player => ({
        ...player,
        win_percentage: player.matches_played > 0 ? (player.matches_won / player.matches_played) * 100 : 0
      })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.win_percentage !== a.win_percentage) return b.win_percentage - a.win_percentage;
        if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
        return b.sets_won - a.sets_won;
      });

      console.log('Player standings calculated:', standingsArray);
      return standingsArray;
    },
    enabled: !!leagueId,
  });
};
