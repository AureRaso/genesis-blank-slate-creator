
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Trainer = {
  id: string;
  profile_id: string;
  specialty?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
    phone?: string;
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
          profiles!inner(full_name, email),
          trainer_clubs(
            club_id,
            clubs!inner(name)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

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
        .from('trainer_clubs')
        .select(`
          trainers!inner(
            *,
            profiles!inner(full_name, email)
          )
        `)
        .eq('club_id', clubId)
        .eq('trainers.is_active', true);

      if (error) throw error;
      return data.map(item => item.trainers) as Trainer[];
    },
    enabled: !!clubId,
  });
};

export const useCreateTrainer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trainerData: CreateTrainerData) => {
      // 1. Crear el perfil del usuario
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: trainerData.email,
        password: Math.random().toString(36).slice(-12), // Contraseña temporal
        email_confirm: true,
        user_metadata: {
          full_name: trainerData.full_name,
          role: 'trainer'
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Crear el perfil en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: trainerData.email,
          full_name: trainerData.full_name,
          role: 'trainer'
        }]);

      if (profileError) throw profileError;

      // 3. Crear el registro en trainers
      const { data: trainerRecord, error: trainerError } = await supabase
        .from('trainers')
        .insert([{
          profile_id: authData.user.id,
          specialty: trainerData.specialty,
          photo_url: trainerData.photo_url,
          is_active: trainerData.is_active ?? true
        }])
        .select()
        .single();

      if (trainerError) throw trainerError;

      // 4. Asociar con los clubs
      if (trainerData.club_ids.length > 0) {
        const clubAssociations = trainerData.club_ids.map(clubId => ({
          trainer_profile_id: authData.user.id,
          club_id: clubId
        }));

        const { error: clubError } = await supabase
          .from('trainer_clubs')
          .insert(clubAssociations);

        if (clubError) throw clubError;
      }

      return trainerRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-by-club'] });
      toast({
        title: "Éxito",
        description: "Profesor creado correctamente. Se le enviará un email para establecer su contraseña.",
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
    mutationFn: async ({ id, profile_id, club_ids, ...updates }: Partial<Trainer> & { id: string; profile_id: string; club_ids?: string[] }) => {
      // 1. Actualizar el trainer
      const { data, error } = await supabase
        .from('trainers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 2. Si se proporcionan club_ids, actualizar las asociaciones
      if (club_ids) {
        // Eliminar asociaciones existentes
        await supabase
          .from('trainer_clubs')
          .delete()
          .eq('trainer_profile_id', profile_id);

        // Crear nuevas asociaciones
        if (club_ids.length > 0) {
          const clubAssociations = club_ids.map(clubId => ({
            trainer_profile_id: profile_id,
            club_id: clubId
          }));

          const { error: clubError } = await supabase
            .from('trainer_clubs')
            .insert(clubAssociations);

          if (clubError) throw clubError;
        }
      }

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
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-by-club'] });
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

export const useMyTrainerProfile = () => {
  return useQuery({
    queryKey: ['my-trainer-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          profiles!inner(full_name, email),
          trainer_clubs(
            club_id,
            clubs!inner(name, address, phone)
          )
        `)
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;
      return data as Trainer;
    },
  });
};
