
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
}

export const useProgrammedClasses = (clubId?: string) => {
  return useQuery({
    queryKey: ["programmed-classes", clubId],
    queryFn: async () => {
      console.log("useProgrammedClasses - Fetching classes for clubId:", clubId);
      
      let query = supabase
        .from("programmed_classes")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (clubId) {
        query = query.eq("club_id", clubId);
        console.log("useProgrammedClasses - Adding club filter for:", clubId);
      }

      const { data, error } = await query;
      
      console.log("useProgrammedClasses - Query result:", { data: data?.length, error });
      if (data) {
        console.log("useProgrammedClasses - Classes found:", data.map(c => ({ id: c.id, name: c.name, club_id: c.club_id })));
      }

      if (error) throw error;
      return data as ProgrammedClass[];
    },
  });
};

export const useCreateProgrammedClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProgrammedClassData) => {
      const { selected_students, group_id, ...classData } = data;

      // Create the programmed class
      const { data: createdClass, error: classError } = await supabase
        .from("programmed_classes")
        .insert([{ ...classData, group_id }])
        .select()
        .single();

      if (classError) throw classError;

      // Handle participants based on whether a group or individual students were selected
      let participantsData: any[] = [];

      if (group_id) {
        // If a group was selected, get all group members
        const { data: groupMembers, error: groupError } = await supabase
          .from("group_members")
          .select("student_enrollment_id")
          .eq("group_id", group_id)
          .eq("is_active", true);

        if (groupError) throw groupError;

        participantsData = groupMembers.map(member => ({
          class_id: createdClass.id,
          student_enrollment_id: member.student_enrollment_id,
          status: 'active'
        }));
      } else if (selected_students && selected_students.length > 0) {
        // If individual students were selected
        participantsData = selected_students.map(studentId => ({
          class_id: createdClass.id,
          student_enrollment_id: studentId,
          status: 'active'
        }));
      }

      // Create class participants if there are any
      if (participantsData.length > 0) {
        const { error: participantsError } = await supabase
          .from("class_participants")
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      return createdClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      toast({
        title: "Clase creada",
        description: "La clase programada se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error creating programmed class:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la clase programada: " + error.message,
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
          student:student_enrollments!student_enrollment_id(
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
