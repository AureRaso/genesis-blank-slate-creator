import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Ejercicio,
  CreateEjercicioData,
  UpdateEjercicioData,
  EjercicioFilters,
  PosicionJugador,
  Movimiento
} from "@/types/ejercicios";

// Hook principal para obtener ejercicios con filtros
export const useEjercicios = (filters?: EjercicioFilters) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['ejercicios', profile?.club_id, filters],
    queryFn: async () => {
      if (!profile?.club_id) return [];

      let query = supabase
        .from('ejercicios')
        .select(`
          *,
          clubs(name)
        `)
        .eq('club_id', profile.club_id)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.nivel) {
        query = query.eq('nivel', filters.nivel);
      }
      if (filters?.intensidad) {
        query = query.eq('intensidad', filters.intensidad);
      }
      if (filters?.jugadores) {
        query = query.eq('jugadores', filters.jugadores);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ejercicios:', error);
        throw error;
      }

      // Filtrar por búsqueda de texto en cliente (nombre, descripción, tags)
      let result = (data || []).map(item => ({
        ...item,
        posiciones: (item.posiciones || []) as PosicionJugador[],
        movimientos: (item.movimientos || []) as Movimiento[],
        tags: (item.tags || []) as string[]
      })) as Ejercicio[];

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(ej =>
          ej.nombre.toLowerCase().includes(searchLower) ||
          ej.descripcion?.toLowerCase().includes(searchLower) ||
          ej.objetivo.toLowerCase().includes(searchLower) ||
          ej.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return result;
    },
    enabled: !!profile?.club_id,
  });
};

// Hook para obtener un ejercicio por ID
export const useEjercicio = (id?: string) => {
  return useQuery({
    queryKey: ['ejercicio', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('ejercicios')
        .select(`
          *,
          clubs(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ejercicio:', error);
        throw error;
      }

      return {
        ...data,
        posiciones: (data.posiciones || []) as PosicionJugador[],
        movimientos: (data.movimientos || []) as Movimiento[],
        tags: (data.tags || []) as string[]
      } as Ejercicio;
    },
    enabled: !!id,
  });
};

// Hook para crear ejercicio
export const useCreateEjercicio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ejercicioData: CreateEjercicioData) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('ejercicios')
        .insert([{
          ...ejercicioData,
          tags: ejercicioData.tags || [],
          posiciones: ejercicioData.posiciones || [],
          movimientos: ejercicioData.movimientos || [],
          created_by: userData.user.id
        }])
        .select(`
          *,
          clubs(name)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        posiciones: (data.posiciones || []) as PosicionJugador[],
        movimientos: (data.movimientos || []) as Movimiento[],
        tags: (data.tags || []) as string[]
      } as Ejercicio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      toast({
        title: "Éxito",
        description: "Ejercicio creado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating ejercicio:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el ejercicio",
        variant: "destructive",
      });
    },
  });
};

// Hook para actualizar ejercicio
export const useUpdateEjercicio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEjercicioData & { id: string }) => {
      const { data, error } = await supabase
        .from('ejercicios')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          clubs(name)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        posiciones: (data.posiciones || []) as PosicionJugador[],
        movimientos: (data.movimientos || []) as Movimiento[],
        tags: (data.tags || []) as string[]
      } as Ejercicio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      queryClient.invalidateQueries({ queryKey: ['ejercicio'] });
      toast({
        title: "Éxito",
        description: "Ejercicio actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating ejercicio:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ejercicio",
        variant: "destructive",
      });
    },
  });
};

// Hook para eliminar ejercicio (soft delete)
export const useDeleteEjercicio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - marcar como inactivo
      const { error } = await supabase
        .from('ejercicios')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      toast({
        title: "Éxito",
        description: "Ejercicio eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting ejercicio:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el ejercicio",
        variant: "destructive",
      });
    },
  });
};
