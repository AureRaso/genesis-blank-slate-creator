
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

  const createProgrammedClassFn = async (data: CreateProgrammedClassData, retryCount = 0): Promise<{ success: true; class_id: string }> => {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 10000; // Increased timeout to 10 seconds
    
    console.log(`🔄 Creating class (attempt ${retryCount + 1}/${MAX_RETRIES + 1}): ${data.name}`);
    
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
      // Add unique constraint check to prevent duplicates
      const uniqueCheck = `${data.name}_${data.club_id}_${data.court_number}_${data.start_time}_${data.days_of_week.join('')}`;
      
      const createOperation = async () => {
        // Create the base programmed class with minimal select to reduce payload
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
          .select('id')
          .single();

        if (classError) {
          console.error('❌ Database error:', classError);
          if (classError.code === '23505') {
            throw new Error('Ya existe una clase con estos datos exactos. Verifica horarios y pistas.');
          }
          if (classError.code === '23503') {
            throw new Error('Error de referencia: verifica que el entrenador y club existan.');
          }
          if (classError.code === 'PGRST116') {
            throw new Error('No tienes permisos para crear clases en este club.');
          }
          throw new Error(`Error de base de datos: ${classError.message || 'Error desconocido'}`);
        }

        if (!createdClass?.id) {
          throw new Error('No se pudo obtener el ID de la clase creada');
        }

        createdClassId = createdClass.id;
        console.log('✅ Class created successfully:', createdClassId);

        // Handle participants efficiently if needed
        if (data.group_id || (data.selected_students && data.selected_students.length > 0)) {
          let participantsData: any[] = [];

          if (data.group_id) {
            console.log('🔍 Fetching group members...');
            const { data: groupMembers, error: groupError } = await supabase
              .from("group_members")
              .select("student_enrollment_id")
              .eq("group_id", data.group_id)
              .eq("is_active", true)
              .limit(50);
            
            if (groupError) {
              console.error('❌ Group members error:', groupError);
              throw new Error(`Error al obtener miembros del grupo: ${groupError.message}`);
            }

            if (groupMembers && groupMembers.length > 0) {
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

          // Batch insert participants if we have any
          if (participantsData.length > 0) {
            console.log(`➡️ Adding ${participantsData.length} participants...`);
            
            const { error: participantsError } = await supabase
              .from("class_participants")
              .insert(participantsData);

            if (participantsError) {
              console.error('❌ Participants error:', participantsError);
              
              // Rollback: delete the created class
              console.log('🔄 Rolling back class creation...');
              await supabase
                .from("programmed_classes")
                .delete()
                .eq("id", createdClassId);
              
              throw new Error(`Error al agregar participantes: ${participantsError.message}`);
            }
            console.log('✅ Participants added successfully');
          }
        }

        return { success: true as const, class_id: createdClassId };
      };

      // Execute with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
      });

      const result = await Promise.race([createOperation(), timeoutPromise]);
      console.log('✅ Operation completed successfully');
      return result as { success: true; class_id: string };
      
    } catch (error: any) {
      console.error(`❌ Error in class creation (attempt ${retryCount + 1}):`, error.message);
      
      // Detect retryable errors
      const isRetryableError = 
        error.message?.includes('timeout') || 
        error.message?.includes('timed out') ||
        error.message?.includes('network') ||
        error.message?.includes('fetch') ||
        error.message?.includes('Operation timed out') ||
        error.code === 'PGRST301' ||
        error.code === 'XX000';
      
      if (retryCount < MAX_RETRIES && isRetryableError) {
        // Exponential backoff: 2s, 4s, 8s delays
        const delay = Math.pow(2, retryCount + 1) * 1000;
        console.log(`⏳ Retrying in ${delay}ms (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return createProgrammedClassFn(data, retryCount + 1);
      }
      
      // For non-retryable errors or max retries exceeded
      throw error;
    }
  };

  return useMutation({
    mutationFn: createProgrammedClassFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      toast({
        title: "Clase creada",
        description: "La clase programada se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error("❌ Class creation failed:", error);
      
      // Provide specific, actionable error messages
      let errorMessage = error.message || 'Error desconocido';
      let errorTitle = "Error";
      
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorTitle = "Timeout";
        errorMessage = "La operación tardó demasiado tiempo. La base de datos puede estar sobrecargada. Intenta crear menos clases a la vez o espera unos minutos.";
      } else if (error.message?.includes('FunctionsHttpError') || error.code === 'XX000') {
        errorTitle = "Error del servidor";
        errorMessage = "Error interno del servidor. El equipo técnico ha sido notificado. Intenta de nuevo en unos minutos.";
      } else if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        errorTitle = "Error de conexión";
        errorMessage = "Problemas de conectividad. Verifica tu conexión a internet y vuelve a intentar.";
      } else if (error.message?.includes('23505')) {
        errorTitle = "Datos duplicados";
        errorMessage = "Ya existe una clase con esos datos. Revisa los horarios y números de pista.";
      } else if (error.message?.includes('23503')) {
        errorTitle = "Datos inválidos";
        errorMessage = "Error de referencia en los datos. Verifica que el entrenador y club seleccionados existan.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
