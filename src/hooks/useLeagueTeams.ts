
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLeagueTeams = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-teams', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching teams for league:', leagueId);
      const { data, error } = await supabase
        .from('league_teams')
        .select(`
          *,
          teams:team_id (
            id,
            name,
            player1:player1_id (id, name, email, level),
            player2:player2_id (id, name, email, level)
          )
        `)
        .eq('league_id', leagueId);

      if (error) {
        console.error('Error fetching league teams:', error);
        throw error;
      }

      console.log('League teams fetched:', data);
      return data;
    },
    enabled: !!leagueId,
  });
};

export const useAddTeamToLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leagueId, teamId }: { leagueId: string; teamId: string }) => {
      console.log('Adding team to league:', { leagueId, teamId });
      const { data, error } = await supabase
        .from('league_teams')
        .insert([{ league_id: leagueId, team_id: teamId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding team to league:', error);
        throw error;
      }

      console.log('Team added to league:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-teams', variables.leagueId] });
      toast({
        title: "Equipo agregado",
        description: "El equipo ha sido agregado a la liga exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error adding team to league:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el equipo a la liga.",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveTeamFromLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leagueId, teamId }: { leagueId: string; teamId: string }) => {
      console.log('Removing team from league:', { leagueId, teamId });
      const { error } = await supabase
        .from('league_teams')
        .delete()
        .eq('league_id', leagueId)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error removing team from league:', error);
        throw error;
      }

      console.log('Team removed from league');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-teams', variables.leagueId] });
      toast({
        title: "Equipo removido",
        description: "El equipo ha sido removido de la liga exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error removing team from league:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el equipo de la liga.",
        variant: "destructive",
      });
    },
  });
};
