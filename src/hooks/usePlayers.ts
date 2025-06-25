
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/padel';
import { toast } from '@/hooks/use-toast';

export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Player[];
    },
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (player: Omit<Player, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Jugador creado",
        description: "El jugador ha sido registrado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el jugador",
        variant: "destructive",
      });
      console.error('Error creating player:', error);
    },
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Player> & { id: string }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Jugador actualizado",
        description: "Los datos del jugador han sido actualizados",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el jugador",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Jugador eliminado",
        description: "El jugador ha sido eliminado del sistema",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el jugador",
        variant: "destructive",
      });
    },
  });
};
