
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/types/padel';
import { toast } from '@/hooks/use-toast';

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      console.log('Fetching teams...');
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          player1:profiles!teams_player1_id_fkey (
            id,
            full_name
          ),
          player2:profiles!teams_player2_id_fkey (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }

      console.log('Teams fetched:', data);
      
      // Transform the data to match expected type
      return data.map(team => ({
        ...team,
        player1: Array.isArray(team.player1) ? team.player1[0] : team.player1,
        player2: Array.isArray(team.player2) ? team.player2[0] : team.player2,
      })) as (Team & { 
        player1: { id: string; full_name: string }; 
        player2: { id: string; full_name: string }; 
      })[];
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (team: Omit<Team, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Pareja creada",
        description: "La pareja ha sido formada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la pareja. Verifica que los jugadores no estén ya emparejados.",
        variant: "destructive",
      });
      console.error('Error creating team:', error);
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Pareja eliminada",
        description: "La pareja ha sido eliminada del sistema",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la pareja",
        variant: "destructive",
      });
    },
  });
};
