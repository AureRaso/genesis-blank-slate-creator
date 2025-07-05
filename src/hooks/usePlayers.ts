
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/padel';
import { toast } from '@/hooks/use-toast';

export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      console.log('usePlayers - Starting query...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email, 
          level, 
          created_at, 
          role,
          club_id,
          clubs(name, status)
        `)
        .eq('role', 'player')
        .order('created_at', { ascending: false });
      
      console.log('usePlayers - Query result:', { 
        dataCount: data?.length || 0, 
        error: error?.message 
      });
      
      if (error) {
        console.error('Error fetching players:', error);
        throw error;
      }
      
      // Transform data to match Player interface
      const players = (data || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Sin nombre',
        email: profile.email || '',
        level: profile.level || 3,
        club_id: profile.club_id,
        club_name: profile.clubs?.name || (profile.club_id ? 'Club desconocido' : 'Sin club'),
        club_status: profile.clubs?.status || null,
        created_at: profile.created_at
      })) as (Player & { 
        club_id?: string; 
        club_name?: string; 
        club_status?: string;
      })[];
      
      console.log('usePlayers - Transformed players:', players.length);
      return players;
    },
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; email?: string; level?: number; club_id?: string }) => {
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.email) profileUpdates.email = updates.email;
      if (updates.level !== undefined) profileUpdates.level = updates.level;
      if (updates.club_id !== undefined) profileUpdates.club_id = updates.club_id || null;

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
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
        description: "Los datos del jugador han sido actualizados correctamente",
      });
    },
    onError: (error: any) => {
      let message = "No se pudo actualizar el jugador";
      if (error.message?.includes('row-level security')) {
        message = "No tienes permisos para actualizar jugadores";
      }
      
      toast({
        title: "Error",
        description: message,
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
        .from('profiles')
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
    onError: (error: any) => {
      let message = "No se pudo eliminar el jugador";
      if (error.message?.includes('row-level security')) {
        message = "No tienes permisos para eliminar jugadores";
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });
};
