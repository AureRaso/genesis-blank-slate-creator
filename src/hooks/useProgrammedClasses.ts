
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
    mutationFn: async (data: CreateProgrammedClassData, retryCount = 0): Promise<{ success: true; class_id: string }> => {
      const MAX_RETRIES = 2;
      
      console.log(`Creating programmed class directly (attempt ${retryCount + 1})...`);
      
      // Validate required data
      if (!data.name?.trim()) {
        throw new Error('El nombre de la clase es obligatorio');
      }
      if (!data.trainer_profile_id) {
        throw new Error('El entrenador es obligatorio');
      }
      if (!data.club_id) {
        throw new Error('El club es obligatorio');
      }
      if (!data.start_time || !data.days_of_week?.length) {
        throw new Error('La hora y días de la semana son obligatorios');
      }
      
      let createdClassId: string | null = null;
      
      try {
        // Create the base programmed class
        const { data: createdClass, error: classError } = await supabase
          .from("programmed_classes")
          .insert({
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
            max_participants: data.max_participants || 8,
            group_id: data.group_id
          })
          .select()
          .single();

        if (classError) {
          console.error('Error creating programmed class:', classError);
          // Handle specific Supabase errors
          if (classError.code === '23505') {
            throw new Error('Ya existe una clase con estos datos. Revisa los horarios y pistas.');
          }
          if (classError.code === '23503') {
            throw new Error('Error de referencia: verifica que el entrenador y club existan.');
          }
          throw new Error(`Error al crear la clase: ${classError.message}`);
        }

        createdClassId = createdClass.id;
        console.log('Created programmed class:', createdClassId);

        // Handle participants if needed
        if (data.group_id || (data.selected_students && data.selected_students.length > 0)) {
          let participantsData: any[] = [];

          if (data.group_id) {
            // Get group members with retry
            let groupMembers;
            let groupError;
            
            for (let i = 0; i <= MAX_RETRIES; i++) {
              const result = await supabase
                .from("group_members")
                .select("student_enrollment_id")
                .eq("group_id", data.group_id)
                .eq("is_active", true);
              
              groupMembers = result.data;
              groupError = result.error;
              
              if (!groupError) break;
              if (i < MAX_RETRIES) {
                console.log(`Retrying group members fetch (${i + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (groupError) {
              console.error('Error fetching group members:', groupError);
              throw new Error(`Error al obtener miembros del grupo: ${groupError.message}`);
            }

            if (!groupMembers || groupMembers.length === 0) {
              console.warn('Group has no active members');
            } else {
              participantsData = groupMembers.map(member => ({
                class_id: createdClassId,
                student_enrollment_id: member.student_enrollment_id,
                status: 'active'
              }));
            }
          } else if (data.selected_students && data.selected_students.length > 0) {
            participantsData = data.selected_students.map(studentId => ({
              class_id: createdClassId,
              student_enrollment_id: studentId,
              status: 'active'
            }));
          }

          // Insert participants with retry if we have any
          if (participantsData.length > 0) {
            console.log(`Creating ${participantsData.length} participants`);
            
            let participantsError;
            for (let i = 0; i <= MAX_RETRIES; i++) {
              const result = await supabase
                .from("class_participants")
                .insert(participantsData);
              
              participantsError = result.error;
              
              if (!participantsError) break;
              if (i < MAX_RETRIES) {
                console.log(`Retrying participants creation (${i + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (participantsError) {
              console.error('Error creating participants:', participantsError);
              
              // Rollback: delete the created class since participants failed
              console.log('Rolling back: deleting created class due to participant error');
              await supabase
                .from("programmed_classes")
                .delete()
                .eq("id", createdClassId);
              
              throw new Error(`Error al agregar participantes: ${participantsError.message}`);
            }
          }
        }

        console.log('Successfully created programmed class and participants');
        return { success: true, class_id: createdClassId };
        
      } catch (error: any) {
        console.error('Error in class creation:', error);
        
        // If it's a network/timeout error and we haven't exceeded retries, try again
        if (retryCount < MAX_RETRIES && 
            (error.message?.includes('timeout') || 
             error.message?.includes('network') ||
             error.code === 'PGRST301')) {
          console.log(`Retrying entire operation (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return (this as any).mutationFn(data, retryCount + 1);
        }
        
        throw error;
      }
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
