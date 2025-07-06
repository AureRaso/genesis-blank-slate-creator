import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { League } from '@/types/padel';
import { useToast } from '@/hooks/use-toast';

export const useLeagues = (clubId?: string) => {
  return useQuery({
    queryKey: ['leagues', clubId],
    queryFn: async () => {
      console.log('Fetching leagues with clubId:', clubId);
      
      let query = supabase
        .from('leagues')
        .select(`
          *,
          clubs (
            id,
            name,
            address,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      // Si se proporciona clubId, filtrar por ese club
      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leagues:', error);
        throw error;
      }

      console.log('Leagues fetched:', data);
      return data as League[];
    },
  });
};

export const useCreateLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (league: Omit<League, 'id' | 'created_at'>) => {
      console.log('Creating league:', league);
      const { data, error } = await supabase
        .from('leagues')
        .insert([league])
        .select()
        .single();

      if (error) {
        console.error('Error creating league:', error);
        throw error;
      }

      console.log('League created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      toast({
        title: "Liga creada",
        description: "La liga ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating league:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la liga. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<League> & { id: string }) => {
      console.log('Updating league:', id, updates);
      const { data, error } = await supabase
        .from('leagues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating league:', error);
        throw error;
      }

      console.log('League updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      toast({
        title: "Liga actualizada",
        description: "La liga ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating league:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la liga. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteLeague = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting league:', id);
      const { error } = await supabase
        .from('leagues')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting league:', error);
        throw error;
      }

      console.log('League deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      toast({
        title: "Liga eliminada",
        description: "La liga ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting league:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la liga. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
