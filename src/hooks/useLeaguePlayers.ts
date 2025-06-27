
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
          profile:profiles (
            id,
            full_name,
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

export const usePlayerRegistration = (profileId?: string, leagueId?: string) => {
  return useQuery({
    queryKey: ['player-registration', profileId, leagueId],
    queryFn: async () => {
      if (!profileId || !leagueId) return null;
      
      const { data, error } = await supabase
        .from('league_players')
        .select('*')
        .eq('profile_id', profileId)
        .eq('league_id', leagueId)
        .maybeSingle();

      if (error) {
        console.error('Error checking player registration:', error);
        throw error;
      }

      return data;
    },
    enabled: !!profileId && !!leagueId,
  });
};

export const useRegisterForLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leagueId, profileId }: { leagueId: string; profileId: string }) => {
      console.log('Registering profile for league:', { leagueId, profileId });
      const { data, error } = await supabase
        .from('league_players')
        .insert([{ league_id: leagueId, profile_id: profileId, status: 'approved' }])
        .select()
        .single();

      if (error) {
        console.error('Error registering for league:', error);
        throw error;
      }

      console.log('Profile registered for league:', data);
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
    mutationFn: async ({ leagueId, profileId }: { leagueId: string; profileId: string }) => {
      console.log('Withdrawing profile from league:', { leagueId, profileId });
      const { error } = await supabase
        .from('league_players')
        .delete()
        .eq('league_id', leagueId)
        .eq('profile_id', profileId);

      if (error) {
        console.error('Error withdrawing from league:', error);
        throw error;
      }

      console.log('Profile withdrawn from league');
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
      profileId, 
      status 
    }: { 
      leagueId: string; 
      profileId: string; 
      status: 'approved' | 'rejected' 
    }) => {
      console.log('Updating player status:', { leagueId, profileId, status });
      const { data, error } = await supabase
        .from('league_players')
        .update({ status })
        .eq('league_id', leagueId)
        .eq('profile_id', profileId)
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
