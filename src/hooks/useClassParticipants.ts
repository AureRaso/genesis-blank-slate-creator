import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClassParticipant {
  id: string;
  class_id: string;
  student_enrollment_id: string;
  status: string;
  discount_1?: number;
  discount_2?: number;
  payment_status: string;
  payment_method?: string;
  payment_date?: string;
  payment_verified: boolean;
  payment_notes?: string;
  created_at: string;
  updated_at: string;
  student_enrollment: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    level: number;
  };
}

export const useClassParticipants = (classId?: string) => {
  return useQuery({
    queryKey: ["class-participants", classId],
    queryFn: async () => {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from("class_participants")
        .select(`
          *,
          student_enrollment:student_enrollments(
            id,
            full_name,
            email,
            phone,
            level
          )
        `)
        .eq("class_id", classId)
        .eq("status", "active");

      if (error) throw error;
      return data as ClassParticipant[];
    },
    enabled: !!classId,
  });
};

export const useAddStudentToClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      classId, 
      studentId, 
      paymentMethod, 
      paymentStatus = 'pending',
      paymentNotes 
    }: { 
      classId: string; 
      studentId: string; 
      paymentMethod?: string;
      paymentStatus?: string;
      paymentNotes?: string;
    }) => {
      // Check if student is already in the class
      const { data: existing } = await supabase
        .from("class_participants")
        .select("id")
        .eq("class_id", classId)
        .eq("student_enrollment_id", studentId)
        .eq("status", "active")
        .single();

      if (existing) {
        throw new Error("El alumno ya está inscrito en esta clase");
      }

      const { data, error } = await supabase
        .from("class_participants")
        .insert({
          class_id: classId,
          student_enrollment_id: studentId,
          status: "active",
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_date: paymentStatus === 'paid' ? new Date().toISOString() : null,
          payment_verified: false,
          payment_notes: paymentNotes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ["class-participants", classId] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      toast({
        title: "Alumno añadido",
        description: "El alumno ha sido añadido a la clase correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el alumno a la clase.",
        variant: "destructive"
      });
    },
  });
};

export const useRemoveStudentFromClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from("class_participants")
        .update({ status: "inactive" })
        .eq("id", participantId);

      if (error) throw error;
    },
    onSuccess: (_, participantId) => {
      // Get the class_id from the participant to invalidate the right queries
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      toast({
        title: "Alumno eliminado",
        description: "El alumno ha sido eliminado de la clase correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el alumno de la clase.",
        variant: "destructive"
      });
    },
  });
};

export const useBulkUpdateClassParticipants = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      classId, 
      studentsToAdd, 
      participantsToRemove,
      paymentData = {}
    }: { 
      classId: string; 
      studentsToAdd: string[]; 
      participantsToRemove: string[];
      paymentData?: Record<string, {
        paymentMethod?: string;
        paymentStatus?: string;
        paymentNotes?: string;
      }>
    }) => {
      // Remove students (set status to inactive)
      if (participantsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("class_participants")
          .update({ status: "inactive" })
          .in("id", participantsToRemove);

        if (removeError) throw removeError;
      }

      // Add new students
      if (studentsToAdd.length > 0) {
        // Check for existing participants to avoid duplicates
        const { data: existing } = await supabase
          .from("class_participants")
          .select("student_enrollment_id")
          .eq("class_id", classId)
          .eq("status", "active")
          .in("student_enrollment_id", studentsToAdd);

        const existingIds = existing?.map(p => p.student_enrollment_id) || [];
        const newStudents = studentsToAdd.filter(id => !existingIds.includes(id));

        if (newStudents.length > 0) {
          const participantsToInsert = newStudents.map(studentId => {
            const payment = paymentData[studentId] || {};
            return {
              class_id: classId,
              student_enrollment_id: studentId,
              status: "active",
              payment_status: payment.paymentStatus || 'pending',
              payment_method: payment.paymentMethod,
              payment_date: payment.paymentStatus === 'paid' ? new Date().toISOString() : null,
              payment_verified: false,
              payment_notes: payment.paymentNotes
            };
          });

          const { error: addError } = await supabase
            .from("class_participants")
            .insert(participantsToInsert);

          if (addError) throw addError;
        }
      }
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ["class-participants", classId] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      toast({
        title: "Alumnos actualizados",
        description: "Los cambios se han guardado correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios.",
        variant: "destructive"
      });
    },
  });
};