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

      const { data, error } = await supabase
        .from("class_participants")
        .insert({
          ...participantData,
          status: participantData.status || "active",
          payment_status: participantData.payment_status || "pending",
          payment_verified: participantData.payment_verified || false,
          amount_paid: participantData.amount_paid || 0,
          total_amount_due: participantData.total_amount_due || 0,
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
  club_id: string;
  class_name: string;
  class_start_time: string;
  payment_status?: string;
  payment_method?: string;
  payment_notes?: string;
}

// Hook to add a student to ALL recurring instances of a programmed class
export const useBulkEnrollToRecurringClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentData: BulkEnrollmentData) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      console.log('🔵 Starting bulk enrollment:', enrollmentData);

      // Step 1: Find all classes in the recurring series
      const { data: matchingClasses, error: classesError } = await supabase
        .from('programmed_classes')
        .select('id, name, start_time, club_id')
        .eq('club_id', enrollmentData.club_id)
        .eq('name', enrollmentData.class_name)
        .eq('start_time', enrollmentData.class_start_time);

      if (classesError) {
        console.error('❌ Error fetching matching classes:', classesError);
        throw classesError;
      }

      if (!matchingClasses || matchingClasses.length === 0) {
        throw new Error('No se encontraron clases en la serie recurrente');
      }

      console.log(`✅ Found ${matchingClasses.length} classes in recurring series`);

      // Step 2: Check which classes the student is NOT already enrolled in
      const classIds = matchingClasses.map(c => c.id);
      const { data: existingEnrollments, error: enrollmentError } = await supabase
        .from('class_participants')
        .select('class_id')
        .eq('student_enrollment_id', enrollmentData.student_enrollment_id)
        .in('class_id', classIds);

      if (enrollmentError) {
        console.error('❌ Error checking existing enrollments:', enrollmentError);
        throw enrollmentError;
      }

      const existingClassIds = new Set(existingEnrollments?.map(e => e.class_id) || []);
      const classesToEnroll = matchingClasses.filter(c => !existingClassIds.has(c.id));

      console.log(`📝 Student already enrolled in ${existingClassIds.size} classes`);
      console.log(`➕ Will enroll in ${classesToEnroll.length} new classes`);

      if (classesToEnroll.length === 0) {
        throw new Error('El alumno ya está inscrito en todas las clases de esta serie');
      }

      // Step 3: Bulk insert the student into all classes
      const participantsToInsert = classesToEnroll.map(cls => ({
        class_id: cls.id,
        student_enrollment_id: enrollmentData.student_enrollment_id,
        status: 'active',
        payment_status: enrollmentData.payment_status || 'pending',
        payment_method: enrollmentData.payment_method || '',
        payment_notes: enrollmentData.payment_notes || '',
        payment_verified: false,
        amount_paid: 0,
        total_amount_due: 0,
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('class_participants')
        .insert(participantsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error inserting participants:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully enrolled student in ${insertedData?.length || 0} classes`);

      return {
        enrolled: insertedData?.length || 0,
        total: matchingClasses.length,
        skipped: existingClassIds.size
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-classes"] });
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
  club_id: string;
  class_name: string;
  class_start_time: string;
}

// Hook to remove a student from ALL recurring instances of a programmed class
export const useBulkRemoveFromRecurringClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (removalData: BulkRemovalData) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      console.log('🔵 Starting bulk removal:', removalData);

      // Step 1: Find all classes in the recurring series
      const { data: matchingClasses, error: classesError } = await supabase
        .from('programmed_classes')
        .select('id, name, start_time, club_id')
        .eq('club_id', removalData.club_id)
        .eq('name', removalData.class_name)
        .eq('start_time', removalData.class_start_time);

      if (classesError) {
        console.error('❌ Error fetching matching classes:', classesError);
        throw classesError;
      }

      if (!matchingClasses || matchingClasses.length === 0) {
        throw new Error('No se encontraron clases en la serie recurrente');
      }

      console.log(`✅ Found ${matchingClasses.length} classes in recurring series`);

      // Step 2: Find all enrollments for this student in these classes
      const classIds = matchingClasses.map(c => c.id);
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_participants')
        .select('id, class_id')
        .eq('student_enrollment_id', removalData.student_enrollment_id)
        .in('class_id', classIds);

      if (enrollmentError) {
        console.error('❌ Error fetching enrollments:', enrollmentError);
        throw enrollmentError;
      }

      if (!enrollments || enrollments.length === 0) {
        throw new Error('El alumno no está inscrito en ninguna clase de esta serie');
      }

      console.log(`📝 Found ${enrollments.length} enrollments to remove`);

      // Step 3: Mark all enrollments as inactive (soft delete) - one by one to avoid RLS issues
      let successCount = 0;
      const errors = [];

      for (const enrollment of enrollments) {
        const { error: updateError } = await supabase
          .from('class_participants')
          .update({ status: 'inactive' })
          .eq('id', enrollment.id);

        if (updateError) {
          console.error(`❌ Error updating participant ${enrollment.id}:`, updateError);
          errors.push(updateError);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} out of ${enrollments.length} enrollments`);
      }

      console.log(`✅ Successfully removed student from ${successCount} classes`);

      return {
        removed: enrollments.length,
        total: matchingClasses.length
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