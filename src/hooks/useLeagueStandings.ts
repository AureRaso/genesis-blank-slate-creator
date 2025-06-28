
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeagueStandings = (leagueId: string) => {
  return useQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: async () => {
      // Obtener todos los equipos de la liga
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('league_teams')
        .select(`
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

      if (!leagueTeams || leagueTeams.length === 0) {
        return [];
      }

      // Obtener todos los partidos completados de la liga
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          match_results (*),
          team1:teams!matches_team1_id_fkey (
            id,
            name
          ),
          team2:teams!matches_team2_id_fkey (
            id,
            name
          )
        `)
        .eq('league_id', leagueId)
        .eq('status', 'completed');

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        throw matchesError;
      }

      // Calcular estadísticas por equipo
      const teamStats = new Map();

      // Inicializar estadísticas para todos los equipos
      leagueTeams.forEach(lt => {
        const team = lt.teams;
        if (team) {
          teamStats.set(team.id, {
            team_id: team.id,
            team_name: team.name,
            player1_name: team.player1?.full_name || 'Jugador 1',
            player2_name: team.player2?.full_name || 'Jugador 2',
            matches_played: 0,
            matches_won: 0,
            matches_lost: 0,
            sets_won: 0,
            sets_lost: 0,
            games_won: 0,
            games_lost: 0,
            points: 0,
            position: 0
          });
        }
      });

      // Calcular estadísticas basadas en los partidos
      matches?.forEach(match => {
        const result = match.match_results?.[0];
        if (!result) return;

        const team1Stats = teamStats.get(match.team1_id);
        const team2Stats = teamStats.get(match.team2_id);

        if (team1Stats && team2Stats) {
          // Incrementar partidos jugados
          team1Stats.matches_played++;
          team2Stats.matches_played++;

          // Calcular sets y games
          const team1Sets = (result.team1_set1 > result.team2_set1 ? 1 : 0) +
                           (result.team1_set2 > result.team2_set2 ? 1 : 0) +
                           (result.team1_set3 && result.team2_set3 ? 
                            (result.team1_set3 > result.team2_set3 ? 1 : 0) : 0);

          const team2Sets = (result.team2_set1 > result.team1_set1 ? 1 : 0) +
                           (result.team2_set2 > result.team1_set2 ? 1 : 0) +
                           (result.team1_set3 && result.team2_set3 ? 
                            (result.team2_set3 > result.team1_set3 ? 1 : 0) : 0);

          team1Stats.sets_won += team1Sets;
          team1Stats.sets_lost += team2Sets;
          team2Stats.sets_won += team2Sets;
          team2Stats.sets_lost += team1Sets;

          // Games
          team1Stats.games_won += (result.team1_set1 + result.team1_set2 + (result.team1_set3 || 0));
          team1Stats.games_lost += (result.team2_set1 + result.team2_set2 + (result.team2_set3 || 0));
          team2Stats.games_won += (result.team2_set1 + result.team2_set2 + (result.team2_set3 || 0));
          team2Stats.games_lost += (result.team1_set1 + result.team1_set2 + (result.team1_set3 || 0));

          // Determinar ganador y puntos
          if (result.winner_team_id === match.team1_id) {
            team1Stats.matches_won++;
            team2Stats.matches_lost++;
            team1Stats.points += result.points_team1;
            team2Stats.points += result.points_team2;
          } else {
            team2Stats.matches_won++;
            team1Stats.matches_lost++;
            team2Stats.points += result.points_team2;
            team1Stats.points += result.points_team1;
          }
        }
      });

      // Convertir a array y ordenar
      const standings = Array.from(teamStats.values())
        .sort((a, b) => {
          // Primero por puntos
          if (b.points !== a.points) return b.points - a.points;
          // Luego por diferencia de sets
          const aDiff = a.sets_won - a.sets_lost;
          const bDiff = b.sets_won - b.sets_lost;
          if (bDiff !== aDiff) return bDiff - aDiff;
          // Finalmente por diferencia de games
          const aGamesDiff = a.games_won - a.games_lost;
          const bGamesDiff = b.games_won - b.games_lost;
          return bGamesDiff - aGamesDiff;
        })
        .map((team, index) => ({
          ...team,
          position: index + 1
        }));

      return standings;
    },
    enabled: !!leagueId,
  });
};
