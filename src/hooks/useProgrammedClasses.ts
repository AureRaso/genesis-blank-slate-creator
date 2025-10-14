
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProgrammedClass {
  id: string;
  name: string;
  level_from?: number;
  level_to?: number;
  custom_level?: string;
  duration_minutes: number;
  start_time: string;
  days_of_week: string[];
  start_date: string;
  end_date: string;
  recurrence_type: string;
  trainer_profile_id: string;
  club_id: string;
  court_number?: number;
  group_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ClassParticipant {
  id: string;
  class_id: string;
  student_enrollment_id: string;
  status: string;
  discount_1?: number;
  discount_2?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProgrammedClassData {
  name: string;
  level_from?: number;
  level_to?: number;
  custom_level?: string;
  duration_minutes: number;
  start_time: string;
  days_of_week: string[];
  start_date: string;
  end_date: string;
  recurrence_type: string;
  trainer_profile_id: string;
  club_id: string;
  court_number?: number;
  group_id?: string;
  selected_students?: string[];
  max_participants?: number;
  monthly_price?: number;
}

export const useProgrammedClasses = (clubId?: string) => {
  return useQuery({
    queryKey: ["programmed-classes", clubId],
    queryFn: async () => {
      let query = supabase
        .from("programmed_classes")
        .select(`
          *,
          participants:class_participants(
            id,
            status,
            student_enrollment:student_enrollments(
              id,
              full_name,
              email
            )
          ),
          trainer:profiles!trainer_profile_id(
            full_name
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (clubId) {
        query = query.eq("club_id", clubId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (ProgrammedClass & {
        participants?: any[];
        trainer?: { full_name: string };
      })[];
    },
  });
};

export const useCreateProgrammedClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProgrammedClassData) => {
      console.log('Creating programmed class via edge function...');
      
      // Call the edge function for better performance and reliability
      const { data: result, error } = await supabase.functions.invoke('create-programmed-classes', {
        body: data
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create programmed class');
      }

      console.log('Successfully created programmed class:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      toast({
        title: "Clase creada",
        description: "La clase programada se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error creating programmed class:", error);
      
      // Provide better error messages for timeout and common errors
      let errorMessage = error.message;
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorMessage = "La operación tardó demasiado tiempo. Por favor, intenta crear la clase con menos días o estudiantes.";
      } else if (error.message?.includes('FunctionsHttpError') || error.code === 'XX000') {
        errorMessage = "Error del servidor. Por favor, intenta de nuevo en unos momentos.";
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet y vuelve a intentar.";
      }
      
      toast({
        title: "Error",
        description: "No se pudo crear la clase programada: " + errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useClassParticipants = (classId: string) => {
  return useQuery({
    queryKey: ["class-participants", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_participants")
        .select(`
          *,
          student_enrollment:student_enrollments(
            id,
            full_name,
            email
          )
        `)
        .eq("class_id", classId);

      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
};

export const useUpdateProgrammedClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProgrammedClassData> }) => {
      const { data: result, error } = await supabase
        .from("programmed_classes")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      toast({
        title: "Clase actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la clase: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProgrammedClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔴 [DELETE] Marking programmed class as inactive:', id);

      // First, check the class details and current user
      const { data: classData } = await supabase
        .from("programmed_classes")
        .select("id, trainer_profile_id, created_by, is_active")
        .eq("id", id)
        .single();

      console.log('📋 [DELETE] Class data:', classData);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 [DELETE] Current user:', user?.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user?.id)
        .single();

      console.log('👤 [DELETE] User profile:', profileData);

      // Since RLS policies prevent hard deletion, we use soft delete (is_active = false)
      // This ensures the class disappears from queries while preserving data integrity
      const { data, error } = await supabase
        .from("programmed_classes")
        .update({ is_active: false })
        .eq("id", id)
        .select();

      if (error) {
        console.error('🔴 [DELETE] Failed to mark class as inactive:', error);
        throw error;
      }

      console.log('✅ [DELETE] Update result:', data);

      // Verify the update actually happened
      const { data: verifyData } = await supabase
        .from("programmed_classes")
        .select("id, is_active")
        .eq("id", id)
        .single();

      console.log('🔍 [DELETE] Verification after update:', verifyData);

      if (verifyData && verifyData.is_active === true) {
        console.error('⚠️ [DELETE] UPDATE FAILED - is_active is still true!');
        throw new Error('No se pudo eliminar la clase. Verifica los permisos.');
      }

      console.log('✅ [DELETE] Successfully marked class as inactive');
      return id;
    },
    onSuccess: (deletedId) => {
      console.log('✅ [DELETE] Invalidating queries for deleted class:', deletedId);

      // Remove the queries from cache completely to force refetch
      queryClient.removeQueries({ queryKey: ["programmed-classes"] });
      queryClient.removeQueries({ queryKey: ["scheduled-classes"] });

      // Also invalidate to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });

      toast({
        title: "Clase eliminada",
        description: "La clase se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error('🔴 [DELETE] Error in mutation:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la clase: " + error.message,
        variant: "destructive",
      });
    },
  });
};
