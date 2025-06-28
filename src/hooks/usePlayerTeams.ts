import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePlayerTeams = (leagueId: string, profileId?: string) => {
  return useQuery({
    queryKey: ['player-teams', leagueId, profileId],
    queryFn: async () => {
      if (!profileId || !leagueId) return null;
      
      console.log('Fetching player teams for league:', leagueId, 'profile:', profileId);
      
      // Buscar equipos donde el jugador es player1 o player2 en esta liga
      const { data: leagueTeams, error } = await supabase
        .from('league_teams')
        .select(`
          team_id,
          teams!league_teams_team_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (
              id,
              full_name,
              email
            ),
            player2:profiles!teams_player2_id_fkey (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('league_id', leagueId);

      if (error) {
        console.error('Error fetching league teams:', error);
        throw error;
      }

      // Filtrar equipos donde el jugador participa
      const playerTeam = leagueTeams?.find(lt => {
        const team = lt.teams;
        return team?.player1?.[0]?.id === profileId || team?.player2?.[0]?.id === profileId;
      });

      console.log('Player team found:', playerTeam);
      return playerTeam?.teams || null;
    },
    enabled: !!profileId && !!leagueId,
  });
};

export const useAvailablePlayers = (leagueId: string, currentPlayerId?: string) => {
  return useQuery({
    queryKey: ['available-players', leagueId, currentPlayerId],
    queryFn: async () => {
      if (!leagueId || !currentPlayerId) return [];
      
      // Obtener todos los jugadores inscritos en la liga
      const { data: leaguePlayers, error: playersError } = await supabase
        .from('league_players')
        .select(`
          profile_id,
          profiles!league_players_profile_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('league_id', leagueId)
        .eq('status', 'approved');

      if (playersError) {
        console.error('Error fetching league players:', playersError);
        throw playersError;
      }

      // Obtener todos los equipos existentes en la liga
      const { data: leagueTeams, error: teamsError } = await supabase
        .from('league_teams')
        .select(`
          teams!league_teams_team_id_fkey (
            player1_id,
            player2_id
          )
        `)
        .eq('league_id', leagueId);

      if (teamsError) {
        console.error('Error fetching league teams:', teamsError);
        throw teamsError;
      }

      // IDs de jugadores que ya tienen pareja
      const pairedPlayerIds = new Set<string>();
      leagueTeams?.forEach(lt => {
        if (lt.teams?.player1_id) pairedPlayerIds.add(lt.teams.player1_id);
        if (lt.teams?.player2_id) pairedPlayerIds.add(lt.teams.player2_id);
      });

      // Filtrar jugadores disponibles (sin pareja y que no sea el jugador actual)
      const availablePlayers = leaguePlayers?.filter(lp => {
        const profile = lp.profiles;
        return profile && 
               profile.id !== currentPlayerId && 
               !pairedPlayerIds.has(profile.id);
      }).map(lp => lp.profiles).filter(Boolean) || [];

      console.log('Available players:', availablePlayers);
      return availablePlayers;
    },
    enabled: !!leagueId && !!currentPlayerId,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      leagueId, 
      player1Id, 
      player2Id, 
      teamName 
    }: {
      leagueId: string;
      player1Id: string;
      player2Id: string;
      teamName: string;
    }) => {
      console.log('Creating team:', { leagueId, player1Id, player2Id, teamName });

      // Crear el equipo
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          player1_id: player1Id,
          player2_id: player2Id,
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw teamError;
      }

      // Añadir el equipo a la liga
      const { error: leagueTeamError } = await supabase
        .from('league_teams')
        .insert({
          league_id: leagueId,
          team_id: team.id,
        });

      if (leagueTeamError) {
        console.error('Error adding team to league:', leagueTeamError);
        throw leagueTeamError;
      }

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-players'] });
      queryClient.invalidateQueries({ queryKey: ['league-teams'] });
      toast({
        title: "Equipo creado",
        description: "Tu equipo ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el equipo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
