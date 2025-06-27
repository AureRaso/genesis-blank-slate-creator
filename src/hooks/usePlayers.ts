
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/padel';
import { toast } from '@/hooks/use-toast';

export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_players')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching players:', error);
        throw error;
      }
      return data as Player[];
    },
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (player: { name: string; email: string; level: number }) => {
      // Generate a UUID for the new profile
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: player.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        options: {
          data: {
            full_name: player.name,
          }
        }
      });

      if (authError && authError.message !== 'User already registered') {
        throw authError;
      }

      // If user already exists, insert directly into profiles
      if (authError?.message === 'User already registered') {
        // Use upsert instead of insert to avoid conflicts
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            email: player.email,
            full_name: player.name,
            level: player.level,
            role: 'player'
          }, {
            onConflict: 'email'
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating player profile:', error);
          throw error;
        }
        return data;
      }

      // Update the profile with level if user was created
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            level: player.level,
          })
          .eq('id', user.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating player profile:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Jugador creado",
        description: "El jugador ha sido registrado exitosamente",
      });
    },
    onError: (error: any) => {
      console.error('Error creating player:', error);
      
      let message = "No se pudo crear el jugador";
      if (error.message?.includes('row-level security')) {
        message = "No tienes permisos para crear jugadores";
      } else if (error.message?.includes('duplicate key')) {
        message = "Ya existe un jugador con ese email";
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; email?: string; level?: number }) => {
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.email) profileUpdates.email = updates.email;
      if (updates.level) profileUpdates.level = updates.level;

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
        description: "Los datos del jugador han sido actualizados",
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
