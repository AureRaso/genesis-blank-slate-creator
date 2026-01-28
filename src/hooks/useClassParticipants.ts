import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ClassParticipant {
  id: string;
  class_id: string;
  student_enrollment_id: string;
  status: string;
  payment_status: string;
  payment_verified: boolean;
  amount_paid: number;
  total_amount_due: number;
  payment_method?: string;
  payment_notes?: string;
  discount_1?: number;
  discount_2?: number;
  payment_type: string;
  payment_date?: string;
  months_paid?: number[];
  total_months?: number;
  created_at: string;
  updated_at: string;
  // Related data
  student_enrollment?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    level: number;
  };
  programmed_class?: {
    id: string;
    name: string;
    monthly_price: number;
  };
}

export interface CreateClassParticipantData {
  class_id: string;
  student_enrollment_id: string;
  status?: string;
  payment_status?: string;
  amount_paid?: number;
  total_amount_due?: number;
  payment_method?: string;
  payment_notes?: string;
  discount_1?: number;
  discount_2?: number;
  payment_verified?: boolean;
}

export const useClassParticipants = (classId?: string) => {
  return useQuery({
    queryKey: ["class-participants", classId],
    queryFn: async () => {
      let query = supabase
        .from("class_participants")
        .select(`
          *,
          student_enrollment:student_enrollments(
            id,
            full_name,
            email,
            phone,
            level
          ),
          programmed_class:programmed_classes(
            id,
            name,
            monthly_price
          )
        `);

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClassParticipant[];
    },
    enabled: !!classId,
  });
};

export const useCreateClassParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantData: CreateClassParticipantData) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      // Obtener la fecha de inicio de la clase para auto-confirmar
      const { data: classData } = await supabase
        .from("programmed_classes")
        .select("start_date")
        .eq("id", participantData.class_id)
        .single();

      const { data, error } = await supabase
        .from("class_participants")
        .insert({
          ...participantData,
          status: participantData.status || "active",
          payment_status: participantData.payment_status || "pending",
          payment_verified: participantData.payment_verified || false,
          amount_paid: participantData.amount_paid || 0,
          total_amount_due: participantData.total_amount_due || 0,
          // Auto-confirmar asistencia desde el inicio
          attendance_confirmed_for_date: classData?.start_date || null,
          attendance_confirmed_at: new Date().toISOString(),
          confirmed_by_trainer: false, // Auto-confirmado por el sistema
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
      toast({
        title: "Alumno asignado",
        description: "El alumno ha sido asignado a la clase correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el alumno a la clase",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClassParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClassParticipantData> }) => {
      const { error } = await supabase
        .from("class_participants")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
      toast({
        title: "Participante actualizado",
        description: "Los datos del participante han sido actualizados correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el participante",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClassParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_participants")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
      toast({
        title: "Participante eliminado",
        description: "El participante ha sido eliminado de la clase",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el participante",
        variant: "destructive",
      });
    },
  });
};

export interface BulkEnrollmentData {
  student_enrollment_id: string;
  class_id: string; // Source class ID to identify the series
  club_id: string;
  class_name: string;
  class_start_time: string;
  payment_status?: string;
  payment_method?: string;
  payment_notes?: string;
}

// Helper function to find all classes in a series based on:
// - Same club_id, name, start_time, trainer_profile_id
// - At least 1 common participant (not substitute) - OR all candidates if source class is empty
const findSeriesClassIds = async (classId: string): Promise<string[]> => {
  // 1. Get the source class details
  const { data: sourceClass, error: fetchError } = await supabase
    .from("programmed_classes")
    .select('id, club_id, name, start_time, trainer_profile_id')
    .eq("id", classId)
    .single();

  if (fetchError || !sourceClass) {
    return [classId];
  }

  // 2. Find candidate classes with same club + name + time + trainer
  const { data: candidateClasses, error: candidatesError } = await supabase
    .from('programmed_classes')
    .select('id')
    .eq('club_id', sourceClass.club_id)
    .eq('name', sourceClass.name)
    .eq('start_time', sourceClass.start_time)
    .eq('trainer_profile_id', sourceClass.trainer_profile_id)
    .eq('is_active', true);

  if (candidatesError || !candidateClasses || candidateClasses.length === 0) {
    return [classId];
  }

  // 3. Get non-substitute participants of the source class
  const { data: sourceParticipants, error: participantsError } = await supabase
    .from('class_participants')
    .select('student_enrollment_id')
    .eq('class_id', classId)
    .eq('status', 'active')
    .or('is_substitute.eq.false,is_substitute.is.null');

  if (participantsError) {
    return [classId];
  }

  const sourceParticipantIds = sourceParticipants?.map(p => p.student_enrollment_id) || [];

  // 4. If class has no non-substitute participants, return ALL candidates (same club+name+time+trainer)
  if (sourceParticipantIds.length === 0) {
    return candidateClasses.map(c => c.id);
  }

  // 5. If has participants, filter candidates: keep only those with at least 1 common participant
  const seriesClassIds: string[] = [];

  for (const candidate of candidateClasses) {
    const { data: candidateParticipants } = await supabase
      .from('class_participants')
      .select('student_enrollment_id')
      .eq('class_id', candidate.id)
      .eq('status', 'active')
      .or('is_substitute.eq.false,is_substitute.is.null');

    const candidateParticipantIds = candidateParticipants?.map(p => p.student_enrollment_id) || [];

    const hasCommonParticipant = candidateParticipantIds.some(id =>
      sourceParticipantIds.includes(id)
    );

    if (hasCommonParticipant) {
      seriesClassIds.push(candidate.id);
    }
  }

  if (seriesClassIds.length === 0) {
    return [classId];
  }

  return seriesClassIds;
};

// Hook to add a student to ALL recurring instances of a programmed class
// Uses participant-based series identification to avoid affecting unrelated classes
export const useBulkEnrollToRecurringClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentData: BulkEnrollmentData) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      // Step 1: Find all classes in the series using participant-based identification
      const seriesClassIds = await findSeriesClassIds(enrollmentData.class_id);

      if (seriesClassIds.length === 0) {
        throw new Error('No se encontraron clases en la serie recurrente');
      }

      // Step 2: Get class details for the classes we'll enroll in
      const { data: matchingClasses, error: classesError } = await supabase
        .from('programmed_classes')
        .select('id, name, start_time, club_id, start_date')
        .in('id', seriesClassIds);

      if (classesError || !matchingClasses) {
        throw classesError;
      }

      // Step 3: Check which classes the student is NOT already enrolled in
      const { data: existingEnrollments, error: enrollmentError } = await supabase
        .from('class_participants')
        .select('class_id')
        .eq('student_enrollment_id', enrollmentData.student_enrollment_id)
        .in('class_id', seriesClassIds);

      if (enrollmentError) {
        throw enrollmentError;
      }

      const existingClassIds = new Set(existingEnrollments?.map(e => e.class_id) || []);
      const classesToEnroll = matchingClasses.filter(c => !existingClassIds.has(c.id));

      if (classesToEnroll.length === 0) {
        throw new Error('El alumno ya está inscrito en todas las clases de esta serie');
      }

      // Step 4: Bulk insert the student into all classes con auto-confirmación
      const participantsToInsert = classesToEnroll.map(cls => ({
        class_id: cls.id,
        student_enrollment_id: enrollmentData.student_enrollment_id,
        status: 'active',
        payment_status: enrollmentData.payment_status || 'pending',
        payment_method: enrollmentData.payment_method || null,
        payment_notes: enrollmentData.payment_notes || null,
        payment_verified: false,
        amount_paid: 0,
        total_amount_due: 0,
        // Auto-confirmar asistencia desde el inicio
        attendance_confirmed_for_date: cls.start_date,
        attendance_confirmed_at: new Date().toISOString(),
        confirmed_by_trainer: false, // Auto-confirmado por el sistema
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('class_participants')
        .insert(participantsToInsert)
        .select();

      if (insertError) {
        throw insertError;
      }

      return {
        enrolled: insertedData?.length || 0,
        total: seriesClassIds.length,
        skipped: existingClassIds.size
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      toast({
        title: "Alumno añadido a la serie",
        description: `El alumno ha sido inscrito en ${data.enrolled} clase(s) de la serie recurrente.${data.skipped > 0 ? ` Ya estaba inscrito en ${data.skipped} clase(s).` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo inscribir al alumno en la serie de clases",
        variant: "destructive",
      });
    },
  });
};

export interface BulkRemovalData {
  student_enrollment_id: string;
  class_id: string; // Source class ID to identify the series
  club_id: string;
  class_name: string;
  class_start_time: string;
}

// Hook to remove a student from ALL recurring instances of a programmed class
// Uses participant-based series identification to avoid affecting unrelated classes
export const useBulkRemoveFromRecurringClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (removalData: BulkRemovalData) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      // Step 1: Find all classes in the series using participant-based identification
      const seriesClassIds = await findSeriesClassIds(removalData.class_id);

      if (seriesClassIds.length === 0) {
        throw new Error('No se encontraron clases en la serie recurrente');
      }

      // Step 2: Find all enrollments for this student in these classes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_participants')
        .select('id, class_id')
        .eq('student_enrollment_id', removalData.student_enrollment_id)
        .in('class_id', seriesClassIds);

      if (enrollmentError) {
        throw enrollmentError;
      }

      if (!enrollments || enrollments.length === 0) {
        throw new Error('El alumno no está inscrito en ninguna clase de esta serie');
      }

      // Step 3: Delete all enrollments (hard delete) - one by one to avoid RLS issues
      let successCount = 0;
      const errors = [];

      for (const enrollment of enrollments) {
        const { error: deleteError } = await supabase
          .from('class_participants')
          .delete()
          .eq('id', enrollment.id);

        if (deleteError) {
          errors.push(deleteError);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} out of ${enrollments.length} enrollments`);
      }

      return {
        removed: enrollments.length,
        total: seriesClassIds.length
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
      toast({
        title: "Alumno eliminado de la serie",
        description: `El alumno ha sido eliminado de ${data.removed} clase(s) de la serie recurrente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar al alumno de la serie de clases",
        variant: "destructive",
      });
    },
  });
};