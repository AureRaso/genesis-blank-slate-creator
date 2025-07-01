
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlayerReservationStatus = () => {
  return useQuery({
    queryKey: ['player-reservation-status'],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('class_reservations')
        .select('id')
        .eq('player_profile_id', userData.user.id)
        .limit(1);

      if (error) throw error;
      
      return {
        hasReservations: data.length > 0,
        userId: userData.user.id
      };
    },
  });
};
