
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLeaguePlayers = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-players', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      console.log('Fetching players for league:', leagueId);
      const { data, error } = await supabase
        .from('league_players')
        .select(`
          *,
          player:players (
            id,
            name,
            email,
            level
          )
        `)
        .eq('league_id', leagueId);

      if (error) {
        console.error('Error fetching league players:', error);
        throw error;
      }

      console.log('League players fetched:', data);
      return data;
    },
    enabled: !!leagueId,
  });
};

export const usePlayerRegistration = (playerId?: string, leagueId?: string) => {
  return useQuery({
    queryKey: ['player-registration', playerId, leagueId],
    queryFn: async () => {
      if (!playerId || !leagueId) return null;
      
      const { data, error } = await supabase
        .from('league_players')
        .select('*')
        .eq('player_id', playerId)
        .eq('league_id', leagueId)
        .maybeSingle();

      if (error) {
        console.error('Error checking player registration:', error);
        throw error;
      }

      return data;
    },
    enabled: !!playerId && !!leagueId,
  });
};

export const useRegisterForLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leagueId, playerId }: { leagueId: string; playerId: string }) => {
      console.log('Registering player for league:', { leagueId, playerId });
      const { data, error } = await supabase
        .from('league_players')
        .insert([{ league_id: leagueId, player_id: playerId, status: 'pending' }])
        .select()
        .single();

      if (error) {
        console.error('Error registering for league:', error);
        throw error;
      }

      console.log('Player registered for league:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-players', variables.leagueId] });
      queryClient.invalidateQueries({ queryKey: ['player-registration'] });
      toast({
        title: "Inscripción exitosa",
        description: "Te has inscrito en la liga exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error registering for league:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la inscripción.",
        variant: "destructive",
      });
    },
  });
};

export const useWithdrawFromLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leagueId, playerId }: { leagueId: string; playerId: string }) => {
      console.log('Withdrawing player from league:', { leagueId, playerId });
      const { error } = await supabase
        .from('league_players')
        .delete()
        .eq('league_id', leagueId)
        .eq('player_id', playerId);

      if (error) {
        console.error('Error withdrawing from league:', error);
        throw error;
      }

      console.log('Player withdrawn from league');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-players', variables.leagueId] });
      queryClient.invalidateQueries({ queryKey: ['player-registration'] });
      toast({
        title: "Inscripción cancelada",
        description: "Te has dado de baja de la liga exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error withdrawing from league:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la inscripción.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePlayerStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      leagueId, 
      playerId, 
      status 
    }: { 
      leagueId: string; 
      playerId: string; 
      status: 'approved' | 'rejected' 
    }) => {
      console.log('Updating player status:', { leagueId, playerId, status });
      const { data, error } = await supabase
        .from('league_players')
        .update({ status })
        .eq('league_id', leagueId)
        .eq('player_id', playerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating player status:', error);
        throw error;
      }

      console.log('Player status updated:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-players', variables.leagueId] });
      toast({
        title: "Estado actualizado",
        description: `El estado del jugador ha sido ${variables.status === 'approved' ? 'aprobado' : 'rechazado'}.`,
      });
    },
    onError: (error) => {
      console.error('Error updating player status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del jugador.",
        variant: "destructive",
      });
    },
  });
};
