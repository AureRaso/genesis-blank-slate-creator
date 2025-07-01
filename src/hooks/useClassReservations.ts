
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ClassReservation = {
  id: string;
  slot_id: string;
  player_profile_id: string;
  status: 'reservado' | 'cancelado';
  notes?: string;
  created_at: string;
  updated_at: string;
  class_slots?: {
    trainer_name: string;
    objective: string;
    level: string;
    day_of_week: string;
    start_time: string;
    duration_minutes: number;
    price_per_player: number;
    clubs: {
      name: string;
    };
  };
};

export const useMyReservations = () => {
  return useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_reservations')
        .select(`
          *,
          class_slots!inner(
            trainer_name,
            objective,
            level,
            day_of_week,
            start_time,
            duration_minutes,
            price_per_player,
            court_number,
            clubs!inner(name)
          )
        `)
        .eq('status', 'reservado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClassReservation[];
    },
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservation: { slot_id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('class_reservations')
        .insert([{
          slot_id: reservation.slot_id,
          player_profile_id: (await supabase.auth.getUser()).data.user?.id!,
          notes: reservation.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({
        title: "¡Reserva confirmada!",
        description: "Te has inscrito correctamente en la clase",
      });
    },
    onError: (error) => {
      console.error('Error creating reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo realizar la reserva. Puede que ya estés inscrito o la clase esté completa.",
        variant: "destructive",
      });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('class_reservations')
        .update({ status: 'cancelado' })
        .eq('id', reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      });
    },
  });
};
