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