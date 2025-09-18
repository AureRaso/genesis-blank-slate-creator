
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
            student_enrollment_id,
            discount_1,
            discount_2,
            created_at,
            updated_at,
            amount_paid,
            months_paid,
            payment_date,
            payment_type,
            total_months,
            payment_notes,
            payment_method,
            payment_status,
            payment_verified,
            total_amount_due,
            student_enrollment:student_enrollments(
              id,
              full_name,
              email
            )
          ),
          club:clubs(
            id,
            name
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
        club?: { id: string; name: string };
      })[];
    },
  });
};

// Optimized duplicate checker
export const useCheckDuplicateClass = () => {
  return useMutation({
    mutationFn: async (classData: CreateProgrammedClassData) => {
      const { data, error } = await supabase
        .from('programmed_classes')
        .select('id, name')
        .eq('name', classData.name)
        .eq('club_id', classData.club_id)
        .eq('court_number', classData.court_number || 1)
        .eq('start_time', classData.start_time)
        .eq('start_date', classData.start_date)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.log('❌ Error checking duplicates:', error);
        return { isDuplicate: false, existingClass: null };
      }
      
      return {
        isDuplicate: !!data,
        existingClass: data
      };
    }
  });
};

export const useCreateProgrammedClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProgrammedClassFn = async (data: CreateProgrammedClassData): Promise<{ success: true; class_id: string; isDuplicate?: boolean; message?: string }> => {
    console.log('🔄 Creating class with resilient strategy:', data.name);
    console.log('📋 Full class data:', JSON.stringify(data, null, 2));
    
    // Validate required data
    console.log('✅ Starting validation...');
    if (!data.name?.trim()) {
      console.error('❌ Validation failed: Missing name');
      throw new Error('El nombre de la clase es obligatorio');
    }
    if (!data.trainer_profile_id) {
      console.error('❌ Validation failed: Missing trainer_profile_id');
      throw new Error('El entrenador es obligatorio');
    }
    if (!data.club_id) {
      console.error('❌ Validation failed: Missing club_id');
      throw new Error('El club es obligatorio');
    }
    if (!data.start_time || !data.days_of_week?.length) {
      console.error('❌ Validation failed: Missing start_time or days_of_week');
      console.error('Start time:', data.start_time, 'Days:', data.days_of_week);
      throw new Error('La hora y días de la semana son obligatorios');
    }
    console.log('✅ All validation passed successfully');
    
    try {
      // First, check for duplicates with optimized query
      console.log('🔍 Checking for duplicates...');
      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('programmed_classes')
        .select('id, name')
        .eq('name', data.name)
        .eq('club_id', data.club_id)
        .eq('court_number', data.court_number || 1)
        .eq('start_time', data.start_time)
        .eq('start_date', data.start_date)
        .eq('is_active', true)
        .maybeSingle();
      
      if (duplicateError) {
        console.error('❌ Duplicate check error:', duplicateError);
        throw new Error(`Error checking for duplicates: ${duplicateError.message}`);
      }
      
      if (duplicateCheck) {
        console.log('⚠️ Duplicate class found:', duplicateCheck);
        return {
          success: true, 
          class_id: duplicateCheck.id, 
          isDuplicate: true,
          message: 'Clase ya existe - se recuperó la existente'
        };
      }
      
      // Create with reduced timeout but better error handling
      console.log('➕ Creating new class...');
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

      console.log('📊 Insert result - Error:', classError, 'Data:', createdClass);

      if (classError) {
        console.error('❌ Database error:', classError);
        console.error('❌ Error code:', classError.code);
        console.error('❌ Error message:', classError.message);
        console.error('❌ Error details:', classError.details);
        
        // Check if it was created anyway (common with XX000 errors)
        if (classError.code === 'XX000' || classError.message?.includes('timeout')) {
          console.log('🔍 Checking if class was created despite error...');
          const { data: checkCreated } = await supabase
            .from('programmed_classes')
            .select('id, name')
            .eq('name', data.name)
            .eq('club_id', data.club_id)
            .eq('court_number', data.court_number || 1)
            .eq('start_time', data.start_time)
            .eq('start_date', data.start_date)
            .eq('is_active', true)
            .maybeSingle();
          
          if (checkCreated) {
            console.log('✅ Class was created despite error:', checkCreated.id);
            return { 
              success: true, 
              class_id: checkCreated.id, 
              isDuplicate: false,
              message: 'Clase creada (recuperada tras timeout)'
            };
          }
        }
        
        // Enhanced error handling
        if (classError.code === '23505') {
          throw new Error('Ya existe una clase con estos datos exactos');
        }
        if (classError.code === '23503') {
          throw new Error('Error de referencia: verifica que el entrenador y club existan');
        }
        if (classError.code === 'PGRST116') {
          throw new Error('No tienes permisos para crear clases en este club');
        }
        
        throw new Error(`Error de base de datos: ${classError.message || 'Error desconocido'}`);
      }

      if (!createdClass?.id) {
        throw new Error('No se pudo obtener el ID de la clase creada');
      }

      const createdClassId = createdClass.id;
      console.log('✅ Class created successfully:', createdClassId);

      // Handle participants efficiently with minimal queries
      if (data.group_id || (data.selected_students && data.selected_students.length > 0)) {
        let participantsData: any[] = [];

        if (data.group_id) {
          console.log('🔍 Fetching group members...');
          const { data: groupMembers, error: groupError } = await supabase
            .from("group_members")
            .select("student_enrollment_id")
            .eq("group_id", data.group_id)
            .eq("is_active", true)
            .limit(20); // Reduced limit for faster queries
          
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

        // Batch insert participants
        if (participantsData.length > 0) {
          console.log(`➡️ Adding ${participantsData.length} participants...`);
          
          const { error: participantsError } = await supabase
            .from("class_participants")
            .insert(participantsData);

          if (participantsError) {
            console.error('❌ Participants error:', participantsError);
            // Don't rollback - participants can be added later
            console.log('⚠️ Class created but participants failed - they can be added manually');
          } else {
            console.log('✅ Participants added successfully');
          }
        }
      }

      return { 
        success: true, 
        class_id: createdClassId,
        isDuplicate: false,
        message: 'Clase creada exitosamente'
      };
      
    } catch (error: any) {
      console.error('❌ Final error in class creation:', error.message);
      throw error;
    }
  };

  return useMutation({
    mutationFn: createProgrammedClassFn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      
      if (result.isDuplicate) {
        toast({
          title: "Clase ya existía",
          description: result.message || "Se recuperó la clase existente.",
          variant: "default",
        });
      } else {
        toast({
          title: "Clase creada",
          description: result.message || "La clase programada se ha creado correctamente.",
        });
      }
    },
    onError: (error: any) => {
      console.error("❌ Class creation failed:", error);
      
      // Provide specific, actionable error messages
      let errorMessage = error.message || 'Error desconocido';
      let errorTitle = "Error";
      
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorTitle = "Timeout";
        errorMessage = "La operación tardó demasiado tiempo. La clase puede haberse creado de todas formas - revisa la lista de clases.";
      } else if (error.message?.includes('FunctionsHttpError') || error.code === 'XX000') {
        errorTitle = "Error del servidor";
        errorMessage = "Error interno del servidor. La clase puede haberse creado - revisa la lista.";
      } else if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        errorTitle = "Error de conexión";
        errorMessage = "Problemas de conectividad. Verifica tu conexión a internet y revisa si la clase se creó.";
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
