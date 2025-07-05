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
  // Profile information from join
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
  // Club information from trainer_clubs join
  trainer_clubs?: Array<{
    club_id: string;
    clubs: {
      id: string;
      name: string;
    };
  }>;
};

export type CreateTrainerData = {
  full_name: string;
  email: string;
  club_id: string;
  phone: string;
  specialty?: string;
  photo_url?: string;
  is_active: boolean;
};

export type UpdateTrainerData = {
  id: string;
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
          profiles:profile_id (
            id,
            full_name,
            email
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      
      // Get trainer clubs separately to avoid complex joins
      const trainersWithClubs = await Promise.all(
        (data || []).map(async (trainer) => {
          const { data: trainerClubs, error: clubError } = await supabase
            .from('trainer_clubs')
            .select(`
              club_id,
              clubs:club_id (
                id,
                name
              )
            `)
            .eq('trainer_profile_id', trainer.profile_id);

          if (clubError) {
            console.error('Error fetching trainer clubs:', clubError);
            return { ...trainer, trainer_clubs: [] };
          }

          return { ...trainer, trainer_clubs: trainerClubs || [] };
        })
      );
      
      return trainersWithClubs;
    },
  });
};

export const useMyTrainerProfile = () => {
  return useQuery({
    queryKey: ['my-trainer-profile'],
    queryFn: async () => {
      console.log('Fetching my trainer profile...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      console.log('Current user ID:', userData.user.id);

      // Get trainer data using profile_id
      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select(`
          *,
          profiles:profile_id (
            id,
            full_name,
            email
          )
        `)
        .eq('profile_id', userData.user.id)
        .eq('is_active', true)
        .single();

      if (trainerError && trainerError.code !== 'PGRST116') {
        console.error('Trainer error:', trainerError);
        throw trainerError;
      }
      
      if (!trainer) {
        console.log('No trainer found for current user');
        return null;
      }

      console.log('Trainer found:', trainer);

      // Get trainer clubs separately
      const { data: trainerClubs, error: clubError } = await supabase
        .from('trainer_clubs')
        .select(`
          club_id,
          clubs:club_id (
            id,
            name
          )
        `)
        .eq('trainer_profile_id', trainer.profile_id);

      if (clubError) {
        console.error('Error fetching trainer clubs:', clubError);
        return { ...trainer, trainer_clubs: [] };
      }

      console.log('Trainer clubs found:', trainerClubs);

      return { ...trainer, trainer_clubs: trainerClubs || [] };
    },
  });
};

export const useTrainersByClub = (clubId: string) => {
  return useQuery({
    queryKey: ['trainers', 'by-club', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      
      const { data, error } = await supabase
        .from('trainer_clubs')
        .select(`
          trainer_profile_id,
          trainers:trainer_profile_id (
            *,
            profiles:profile_id (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('club_id', clubId);

      if (error) throw error;
      
      // Transform the data to match the expected format
      return data?.map(item => item.trainers).filter(Boolean) || [];
    },
    enabled: !!clubId,
  });
};

export const useCreateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trainerData: CreateTrainerData) => {
      // Llamar a la Edge Function para crear el usuario completo
      const { data, error } = await supabase.functions.invoke('create-trainer-user', {
        body: {
          full_name: trainerData.full_name,
          email: trainerData.email,
          club_id: trainerData.club_id,
          phone: trainerData.phone,
          specialty: trainerData.specialty || null,
          photo_url: trainerData.photo_url || null,
          is_active: trainerData.is_active
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Error calling create-trainer-user function: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      
      // Mostrar información de la contraseña temporal
      if (data && data.temporary_password) {
        toast({
          title: "Profesor creado correctamente",
          description: `Usuario creado con contraseña temporal: ${data.temporary_password}`,
          duration: 10000, // Mostrar por más tiempo para que pueda copiar la contraseña
        });
      } else {
        toast({
          title: "Éxito",
          description: "Profesor creado correctamente",
        });
      }
    },
    onError: (error) => {
      console.error('Error creating trainer:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el profesor: " + error.message,
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
