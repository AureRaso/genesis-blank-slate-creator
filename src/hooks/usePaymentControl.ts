import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentRecord {
  id: string;
  class_id: string;
  student_enrollment_id: string;
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
    club_id: string;
  };
  programmed_class: {
    id: string;
    name: string;
    monthly_price: number;
    start_date: string;
    end_date: string;
    start_time: string;
    duration_minutes: number;
    days_of_week: string[];
    club: {
      id: string;
      name: string;
    };
  };
}

export const usePaymentRecords = (filters?: {
  clubId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}) => {
  return useQuery({
    queryKey: ["payment-records", filters],
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
            level,
            club_id
          ),
          programmed_class:programmed_classes(
            id,
            name,
            monthly_price,
            start_date,
            end_date,
            start_time,
            duration_minutes,
            days_of_week,
            club:clubs(
              id,
              name
            )
          )
        `)
        .eq("status", "active")
        .not("payment_status", "is", null);

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq("payment_status", filters.paymentStatus);
      }

      if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq("payment_method", filters.paymentMethod);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by club if specified
      let filteredData = data as PaymentRecord[];
      if (filters?.clubId && filters.clubId !== 'all') {
        filteredData = filteredData.filter(record => 
          record.programmed_class.club.id === filters.clubId
        );
      }

      return filteredData;
    },
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      participantId,
      paymentStatus,
      paymentMethod,
      paymentVerified,
      paymentNotes
    }: {
      participantId: string;
      paymentStatus: string;
      paymentMethod?: string;
      paymentVerified?: boolean;
      paymentNotes?: string;
    }) => {
      const updateData: any = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };

      if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
      if (paymentVerified !== undefined) updateData.payment_verified = paymentVerified;
      if (paymentNotes !== undefined) updateData.payment_notes = paymentNotes;

      // Set payment date if status changes to paid
      if (paymentStatus === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("class_participants")
        .update(updateData)
        .eq("id", participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-records"] });
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      toast({
        title: "Pago actualizado",
        description: "El estado del pago ha sido actualizado correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado del pago.",
        variant: "destructive"
      });
    },
  });
};