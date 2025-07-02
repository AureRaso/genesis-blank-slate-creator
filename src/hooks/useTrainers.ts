import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Trainer = {
  id: string;
  club_id: string;
  full_name: string;
  phone: string;
  email?: string;
  specialty?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clubs?: {
    name: string;
  };
};

export type CreateTrainerData = {
  club_id: string;
  full_name: string;
  phone: string;
  email?: string;
  specialty?: string;
  photo_url?: string;
  is_active?: boolean;
};

export const useTrainers = () => {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          clubs!inner(name)
        `)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as Trainer[];
    },
  });
};

export const useTrainersByClub = (clubId: string | null) => {
  return useQuery({
    queryKey: ['trainers-by-club', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as Trainer[];
    },
    enabled: !!clubId,
  });
};

export const useCreateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trainerData: CreateTrainerData) => {
      const { data, error } = await supabase
        .from('trainers')
        .insert([trainerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-by-club'] });
      toast({
        title: "Éxito",
        description: "Profesor creado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating trainer:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el profesor",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trainer> & { id: string }) => {
      const { data, error } = await supabase
        .from('trainers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-by-club'] });
      toast({
        title: "Éxito",
        description: "Profesor actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating trainer:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el profesor",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-by-club'] });
      toast({
        title: "Éxito",
        description: "Profesor eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting trainer:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el profesor",
        variant: "destructive",
      });
    },
  });
};