
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Trainer = {
  id: string;
  profile_id: string;
  specialty: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
  trainer_clubs?: Array<{
    club_id: string;
    clubs?: {
      name: string;
    };
  }>;
};

export type CreateTrainerData = {
  full_name: string;
  email: string;
  phone?: string;
  club_ids: string[];
  specialty?: string;
  photo_url?: string;
  is_active: boolean;
};

export type UpdateTrainerData = {
  id: string;
  profile_id: string;
  specialty?: string;
  photo_url?: string;
  is_active: boolean;
  club_ids: string[];
};

export const useTrainers = () => {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          profiles!inner(id, full_name, email),
          trainer_clubs(
            club_id,
            clubs!inner(name)
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data as Trainer[];
    },
  });
};

export const useMyTrainerProfile = () => {
  return useQuery({
    queryKey: ['my-trainer-profile'],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select(`
          *,
          profiles!inner(id, full_name, email),
          trainer_clubs(
            club_id,
            clubs!inner(name)
          )
        `)
        .eq('profile_id', userData.user.id)
        .eq('is_active', true)
        .single();

      if (trainerError && trainerError.code !== 'PGRST116') throw trainerError;
      return trainer as Trainer | null;
    },
  });
};

export const useTrainersByClub = (clubId: string) => {
  return useQuery({
    queryKey: ['trainers', 'by-club', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          profiles!inner(id, full_name, email),
          trainer_clubs!inner(club_id)
        `)
        .eq('is_active', true)
        .eq('trainer_clubs.club_id', clubId);

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
      // Crear el perfil del profesor
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trainerData.email,
        password: 'temp123', // Contraseña temporal
        options: {
          data: {
            full_name: trainerData.full_name,
            role: 'trainer',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Crear el registro de trainer
      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .insert([{
          profile_id: authData.user.id,
          specialty: trainerData.specialty,
          photo_url: trainerData.photo_url,
          is_active: trainerData.is_active,
        }])
        .select()
        .single();

      if (trainerError) throw trainerError;

      // Asociar con clubs
      if (trainerData.club_ids.length > 0) {
        const clubAssociations = trainerData.club_ids.map(clubId => ({
          trainer_profile_id: authData.user.id,
          club_id: clubId,
        }));

        const { error: clubError } = await supabase
          .from('trainer_clubs')
          .insert(clubAssociations);

        if (clubError) throw clubError;
      }

      return trainer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
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
    mutationFn: async (trainerData: UpdateTrainerData) => {
      // Actualizar datos del trainer
      const { data, error } = await supabase
        .from('trainers')
        .update({
          specialty: trainerData.specialty,
          photo_url: trainerData.photo_url,
          is_active: trainerData.is_active,
        })
        .eq('id', trainerData.id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar asociaciones con clubs
      await supabase
        .from('trainer_clubs')
        .delete()
        .eq('trainer_profile_id', trainerData.profile_id);

      if (trainerData.club_ids.length > 0) {
        const clubAssociations = trainerData.club_ids.map(clubId => ({
          trainer_profile_id: trainerData.profile_id,
          club_id: clubId,
        }));

        const { error: clubError } = await supabase
          .from('trainer_clubs')
          .insert(clubAssociations);

        if (clubError) throw clubError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
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
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast({
        title: "Éxito",
        description: "Profesor desactivado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deactivating trainer:', error);
      toast({
        title: "Error",
        description: "No se pudo desactivar el profesor",
        variant: "destructive",
      });
    },
  });
};
