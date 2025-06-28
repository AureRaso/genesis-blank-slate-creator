
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeagueStanding } from '@/types/padel';

export const useLeagueStandings = (leagueId: string) => {
  return useQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];

      console.log('Fetching standings for league:', leagueId);

      // Get all teams in the league with their match results
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('league_teams')
        .select(`
          team_id,
          teams:teams!league_teams_team_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (id, full_name),
            player2:profiles!teams_player2_id_fkey (id, full_name)
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

      // Calculate standings for each team
      const standings: LeagueStanding[] = leagueTeams.map(lt => {
        const team = lt.teams;
        if (!team) return null;

        const teamMatches = matches?.filter(m => 
          m.team1_id === team.id || m.team2_id === team.id
        ) || [];

        let matchesPlayed = 0;
        let matchesWon = 0;
        let matchesLost = 0;
        let setsFor = 0;
        let setsAgainst = 0;
        let totalPoints = 0;

        teamMatches.forEach(match => {
          const result = match.match_results?.[0];
          if (!result) return;

          matchesPlayed++;

          const isTeam1 = match.team1_id === team.id;
          const wonMatch = result.winner_team_id === team.id;

          if (wonMatch) {
            matchesWon++;
          } else {
            matchesLost++;
          }

          // Calculate sets
          let teamSets = 0;
          let opponentSets = 0;

          if (isTeam1) {
            teamSets += result.team1_set1 > result.team2_set1 ? 1 : 0;
            teamSets += result.team1_set2 > result.team2_set2 ? 1 : 0;
            if (result.team1_set3 !== null && result.team2_set3 !== null) {
              teamSets += result.team1_set3 > result.team2_set3 ? 1 : 0;
            }

            opponentSets += result.team2_set1 > result.team1_set1 ? 1 : 0;
            opponentSets += result.team2_set2 > result.team1_set2 ? 1 : 0;
            if (result.team1_set3 !== null && result.team2_set3 !== null) {
              opponentSets += result.team2_set3 > result.team1_set3 ? 1 : 0;
            }

            totalPoints += result.points_team1;
          } else {
            teamSets += result.team2_set1 > result.team1_set1 ? 1 : 0;
            teamSets += result.team2_set2 > result.team1_set2 ? 1 : 0;
            if (result.team1_set3 !== null && result.team2_set3 !== null) {
              teamSets += result.team2_set3 > result.team1_set3 ? 1 : 0;
            }

            opponentSets += result.team1_set1 > result.team2_set1 ? 1 : 0;
            opponentSets += result.team1_set2 > result.team2_set2 ? 1 : 0;
            if (result.team1_set3 !== null && result.team2_set3 !== null) {
              opponentSets += result.team1_set3 > result.team2_set3 ? 1 : 0;
            }

            totalPoints += result.points_team2;
          }

          setsFor += teamSets;
          setsAgainst += opponentSets;
        });

        return {
          team_id: team.id,
          team_name: team.name,
          player1_name: Array.isArray(team.player1) ? team.player1[0]?.full_name || '' : team.player1?.full_name || '',
          player2_name: Array.isArray(team.player2) ? team.player2[0]?.full_name || '' : team.player2?.full_name || '',
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_lost: matchesLost,
          sets_for: setsFor,
          sets_against: setsAgainst,
          set_difference: setsFor - setsAgainst,
          total_points: totalPoints,
          position: 0,
        };
      }).filter(Boolean) as LeagueStanding[];

      // Sort by total points (descending), then by set difference (descending)
      standings.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return b.set_difference - a.set_difference;
      });

      // Assign positions
      standings.forEach((standing, index) => {
        standing.position = index + 1;
      });

      console.log('Calculated standings:', standings);
      return standings;
    },
    enabled: !!leagueId,
  });
};
