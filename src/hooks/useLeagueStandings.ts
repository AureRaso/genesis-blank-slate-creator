
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeagueStandings = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching standings for league:', leagueId);
      
      // Obtener todos los equipos de la liga
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

      // Obtener todos los partidos finalizados de la liga
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          match_results (
            winner_team_id,
            points_team1,
            points_team2,
            team1_set1,
            team1_set2,
            team1_set3,
            team2_set1,
            team2_set2,
            team2_set3
          )
        `)
        .eq('league_id', leagueId)
        .eq('status', 'completed');

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        throw matchesError;
      }

      // Calcular estadísticas para cada equipo
      const standings = leagueTeams?.map(lt => {
        const team = lt.teams;
        if (!team) return null;

        let points = 0;
        let matchesPlayed = 0;
        let matchesWon = 0;
        let matchesLost = 0;
        let setsWon = 0;
        let setsLost = 0;
        let gamesWon = 0;
        let gamesLost = 0;

        matches?.forEach(match => {
          if (match.team1_id === team.id || match.team2_id === team.id) {
            matchesPlayed++;
            const result = match.match_results?.[0];
            
            if (result) {
              const isTeam1 = match.team1_id === team.id;
              const teamPoints = isTeam1 ? result.points_team1 : result.points_team2;
              const opponentPoints = isTeam1 ? result.points_team2 : result.points_team1;
              
              points += teamPoints;
              
              if (result.winner_team_id === team.id) {
                matchesWon++;
              } else {
                matchesLost++;
              }

              // Calcular sets y games
              if (isTeam1) {
                const team1Sets = [
                  { t1: result.team1_set1, t2: result.team2_set1 },
                  { t1: result.team1_set2, t2: result.team2_set2 },
                  ...(result.team1_set3 !== null ? [{ t1: result.team1_set3, t2: result.team2_set3 }] : [])
                ];
                
                team1Sets.forEach(set => {
                  if (set.t1 > set.t2) setsWon++;
                  else setsLost++;
                  gamesWon += set.t1;
                  gamesLost += set.t2;
                });
              } else {
                const team2Sets = [
                  { t1: result.team2_set1, t2: result.team1_set1 },
                  { t1: result.team2_set2, t2: result.team1_set2 },
                  ...(result.team2_set3 !== null ? [{ t1: result.team2_set3, t2: result.team1_set3 }] : [])
                ];
                
                team2Sets.forEach(set => {
                  if (set.t1 > set.t2) setsWon++;
                  else setsLost++;
                  gamesWon += set.t1;
                  gamesLost += set.t2;
                });
              }
            }
          }
        });

        return {
          team_id: team.id,
          team_name: team.name,
          player1_name: team.player1?.full_name || 'Jugador 1',
          player2_name: team.player2?.full_name || 'Jugador 2',
          points,
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_lost: matchesLost,
          sets_won: setsWon,
          sets_lost: setsLost,
          games_won: gamesWon,
          games_lost: gamesLost,
          sets_difference: setsWon - setsLost,
          games_difference: gamesWon - gamesLost
        };
      }).filter(Boolean);

      // Ordenar por puntos, diferencia de sets, diferencia de games
      const sortedStandings = standings?.sort((a, b) => {
        if (b!.points !== a!.points) return b!.points - a!.points;
        if (b!.sets_difference !== a!.sets_difference) return b!.sets_difference - a!.sets_difference;
        return b!.games_difference - a!.games_difference;
      });

      // Añadir posición
      const standingsWithPosition = sortedStandings?.map((standing, index) => ({
        ...standing,
        position: index + 1
      }));

      console.log('League standings calculated:', standingsWithPosition);
      return standingsWithPosition || [];
    },
    enabled: !!leagueId,
  });
};
