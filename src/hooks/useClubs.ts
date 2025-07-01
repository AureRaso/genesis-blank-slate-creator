
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Club, CreateClubData } from '@/types/clubs';
import { useToast } from '@/hooks/use-toast';

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      console.log('Fetching clubs...');
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clubs:', error);
        throw error;
      }

      console.log('Clubs fetched:', data);
      return data as Club[];
    },
  });
};

export const useCreateClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (club: CreateClubData) => {
      console.log('Creating club:', club);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          ...club,
          created_by_profile_id: userData.user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating club:', error);
        throw error;
      }

      console.log('Club created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast({
        title: "Club creado",
        description: "El club ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating club:', error);
      
      let errorMessage = "No se pudo crear el club. Inténtalo de nuevo.";
      
      if (error.message?.includes('unique_club_per_admin')) {
        errorMessage = "Ya existe un club con este nombre y dirección.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Club> & { id: string }) => {
      console.log('Updating club:', id, updates);
      const { data, error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating club:', error);
        throw error;
      }

      console.log('Club updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast({
        title: "Club actualizado",
        description: "El club ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating club:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el club. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting club:', id);
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting club:', error);
        throw error;
      }

      console.log('Club deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      toast({
        title: "Club eliminado",
        description: "El club ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting club:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el club. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useClubLeagues = (clubId: string) => {
  return useQuery({
    queryKey: ['club-leagues', clubId],
    queryFn: async () => {
      console.log('Fetching leagues for club:', clubId);
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching club leagues:', error);
        throw error;
      }

      return data;
    },
    enabled: !!clubId,
  });
};
