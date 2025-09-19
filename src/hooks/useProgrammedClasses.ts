
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
      console.log('Creating programmed class directly...');
      
      // Create the base programmed class
      const { data: createdClass, error: classError } = await supabase
        .from("programmed_classes")
        .insert([{
          name: data.name,
          level_from: data.level_from,
          level_to: data.level_to,
          custom_level: data.custom_level,
          duration_minutes: data.duration_minutes,
          start_time: data.start_time,
          days_of_week: data.days_of_week,
          start_date: data.start_date,
          end_date: data.end_date,
          recurrence_type: data.recurrence_type,
          trainer_profile_id: data.trainer_profile_id,
          club_id: data.club_id,
          court_number: data.court_number,
          monthly_price: data.monthly_price || 0,
          max_participants: data.max_participants || 8
        }])
        .select()
        .single();

      if (classError) {
        console.error('Error creating programmed class:', classError);
        throw classError;
      }

      console.log('Created programmed class:', createdClass.id);

      // Handle participants if needed
      if (data.group_id || (data.selected_students && data.selected_students.length > 0)) {
        let participantsData: any[] = [];

        if (data.group_id) {
          // Get group members
          const { data: groupMembers, error: groupError } = await supabase
            .from("group_members")
            .select("student_enrollment_id")
            .eq("group_id", data.group_id)
            .eq("is_active", true);

          if (groupError) {
            console.error('Error fetching group members:', groupError);
            throw groupError;
          }

          participantsData = groupMembers.map(member => ({
            class_id: createdClass.id,
            student_enrollment_id: member.student_enrollment_id,
            status: 'active'
          }));
        } else if (data.selected_students && data.selected_students.length > 0) {
          participantsData = data.selected_students.map(studentId => ({
            class_id: createdClass.id,
            student_enrollment_id: studentId,
            status: 'active'
          }));
        }

        // Insert participants
        if (participantsData.length > 0) {
          console.log(`Creating ${participantsData.length} participants`);
          const { error: participantsError } = await supabase
            .from("class_participants")
            .insert(participantsData);

          if (participantsError) {
            console.error('Error creating participants:', participantsError);
            throw participantsError;
          }
        }
      }

      console.log('Successfully created programmed class and participants');
      return { success: true, class_id: createdClass.id };
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
      const { error } = await supabase
        .from("programmed_classes")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      toast({
        title: "Clase eliminada",
        description: "La clase se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la clase: " + error.message,
        variant: "destructive",
      });
    },
  });
};
