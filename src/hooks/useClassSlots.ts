import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ClassSlot = {
  id: string;
  created_by_profile_id: string;
  club_id: string;
  court_number: number;
  trainer_name?: string; // Mantener por compatibilidad
  trainer_id?: string; // Nueva columna
  objective: string;
  level: 'iniciacion' | 'intermedio' | 'avanzado';
  day_of_week: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  start_time: string;
  duration_minutes: number;
  price_per_player: number;
  max_players: number;
  repeat_weekly: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clubs?: {
    name: string;
  };
  trainers?: {
    profiles?: {
      full_name: string;
    };
  };
  class_reservations?: Array<{
    id: string;
    player_profile_id: string;
    status: string;
    profiles: {
      full_name: string;
    };
  }>;
};

export type CreateClassSlotData = {
  club_id: string;
  court_number: number;
  trainer_name: string; // Obligatorio para compatibilidad con DB
  trainer_id?: string; // Nueva columna opcional
  objective: string;
  level: 'iniciacion' | 'intermedio' | 'avanzado';
  day_of_week: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  start_time: string;
  duration_minutes: number;
  price_per_player: number;
  max_players: number;
  repeat_weekly: boolean;
  is_active: boolean;
};

export const useClassSlots = () => {
  return useQuery({
    queryKey: ['class-slots'],
    queryFn: async () => {
      // Obtener el perfil del usuario actual para filtrar por su club
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // Obtener el club_id del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('club_id, role')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;
      
      let query = supabase
        .from('class_slots')
        .select(`
          *,
          clubs!inner(name),
          trainers(
            profiles:profile_id(
              full_name
            )
          ),
          class_reservations(
            id,
            player_profile_id,
            status,
            profiles!inner(full_name)
          )
        `)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      // Si es jugador (no admin), filtrar solo las clases de su club
      if (profileData.role === 'player' && profileData.club_id) {
        query = query.eq('club_id', profileData.club_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClassSlot[];
    },
  });
};

export const useMyClassSlots = () => {
  return useQuery({
    queryKey: ['my-class-slots'],
    queryFn: async (): Promise<ClassSlot[]> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // Obtener el ID del trainer si el usuario es un trainer
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('id')
        .eq('profile_id', userData.user.id)
        .single();

      if (trainerError && trainerError.code !== 'PGRST116') throw trainerError;

      let query = supabase
        .from('class_slots')
        .select(`
          id,
          created_by_profile_id,
          club_id,
          court_number,
          trainer_name,
          trainer_id,
          objective,
          level,
          day_of_week,
          start_time,
          duration_minutes,
          price_per_player,
          max_players,
          repeat_weekly,
          is_active,
          created_at,
          updated_at,
          clubs!inner(name),
          trainers(
            profiles:profile_id(
              full_name
            )
          ),
          class_reservations(
            id,
            player_profile_id,
            status,
            profiles!inner(full_name)
          )
        `)
        .order('day_of_week')
        .order('start_time');

      // Si es trainer, filtrar solo sus clases
      if (trainerData) {
        query = query.eq('trainer_id', trainerData.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as ClassSlot[];
    },
  });
};

export const useCreateClassSlot = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classSlot: CreateClassSlotData) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('class_slots')
        .insert([{
          ...classSlot,
          created_by_profile_id: userData.user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-class-slots'] });
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({
        title: "Éxito",
        description: "Clase creada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating class slot:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la clase",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClassSlot = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClassSlot> & { id: string }) => {
      const { data, error } = await supabase
        .from('class_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-class-slots'] });
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({
        title: "Éxito",
        description: "Clase actualizada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating class slot:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la clase",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClassSlot = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔴 [DELETE] Starting delete for class_slot id:', id);

      const { data, error } = await supabase
        .from('class_slots')
        .delete()
        .eq('id', id)
        .select();

      console.log('🔴 [DELETE] Supabase response:', { data, error });

      if (error) {
        console.error('🔴 [DELETE] Error from Supabase:', error);
        throw error;
      }

      console.log('🔴 [DELETE] Successfully deleted class_slot');
      return data;
    },
    onSuccess: (data) => {
      console.log('🔴 [DELETE] onSuccess called with data:', data);
      queryClient.invalidateQueries({ queryKey: ['my-class-slots'] });
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({
        title: "Éxito",
        description: "Clase eliminada correctamente",
      });
    },
    onError: (error) => {
      console.error('🔴 [DELETE] onError called with error:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la clase",
        variant: "destructive",
      });
    },
  });
};
