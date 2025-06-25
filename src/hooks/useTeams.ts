
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/types/padel';
import { toast } from '@/hooks/use-toast';

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          player1:players!teams_player1_id_fkey(id, name),
          player2:players!teams_player2_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Team & {
        player1: { id: string; name: string };
        player2: { id: string; name: string };
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
