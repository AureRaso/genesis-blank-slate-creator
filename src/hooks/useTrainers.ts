
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
  // Datos del perfil asociado
  email: string;
  full_name: string;
  // Datos de los clubs asignados
  clubs?: { id: string; name: string; }[];
};

export type CreateTrainerData = {
  full_name: string;
  email: string;
  club_id: string;
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

// Type for the database function response
type CreateTrainerUserResponse = {
  user_id?: string;
  trainer_id?: string;
  email?: string;
  temporary_password?: string;
  full_name?: string;
  error?: string;
  error_code?: string;
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
            email,
            full_name
          ),
          trainer_clubs (
            clubs (
              id,
              name
            )
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform the data to match our Trainer type
      return data?.map(trainer => ({
        ...trainer,
        email: trainer.profiles?.email || '',
        full_name: trainer.profiles?.full_name || '',
        clubs: trainer.trainer_clubs?.map(tc => tc.clubs).filter(Boolean) || []
      })) || [];
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

      // Get user profile first to verify they are a trainer
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .eq('role', 'trainer')
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (!profile) return null;

      // Get trainer data
      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select(`
          *,
          trainer_clubs (
            clubs (
              id,
              name
            )
          )
        `)
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .single();

      if (trainerError && trainerError.code !== 'PGRST116') throw trainerError;
      
      if (trainer) {
        return {
          ...trainer,
          email: profile.email,
          full_name: profile.full_name,
          clubs: trainer.trainer_clubs?.map(tc => tc.clubs).filter(Boolean) || []
        };
      }
      
      return null;
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
          trainers (
            *,
            profiles:profile_id (
              email,
              full_name
            )
          )
        `)
        .eq('club_id', clubId)
        .eq('trainers.is_active', true);

      if (error) throw error;
      
      return data?.map(tc => ({
        ...tc.trainers,
        email: tc.trainers.profiles?.email || '',
        full_name: tc.trainers.profiles?.full_name || ''
      })).filter(Boolean) || [];
    },
    enabled: !!clubId,
  });
};

export const useCreateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trainerData: CreateTrainerData) => {
      // Usar la función de base de datos para crear el usuario completo
      const { data, error } = await supabase.rpc('create_trainer_user', {
        trainer_email: trainerData.email,
        trainer_full_name: trainerData.full_name,
        club_id: trainerData.club_id,
        trainer_phone: '', // Campo ya no necesario
        trainer_specialty: trainerData.specialty || null,
        trainer_photo_url: trainerData.photo_url || null
      });

      if (error) throw error;
      
      // Cast the response to our expected type
      const response = data as CreateTrainerUserResponse;
      
      // Verificar si hay error en la respuesta de la función
      if (response && response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      
      // Mostrar la contraseña temporal al administrador
      if (data && data.temporary_password) {
        toast({
          title: "Profesor creado exitosamente",
          description: `Contraseña temporal: ${data.temporary_password}. Comparte esta información con el profesor.`,
          duration: 10000, // 10 segundos para que pueda leer y copiar
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
