import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para obtener las confirmaciones de asistencia para una fecha específica
 * Esto permite que el panel del entrenador muestre el estado correcto según la fecha seleccionada
 */
export const useAttendanceForDate = (participantIds: string[], selectedDate: string | null) => {
  return useQuery({
    queryKey: ['attendance-for-date', participantIds, selectedDate],
    queryFn: async () => {
      if (!selectedDate || participantIds.length === 0) {
        return new Map();
      }

      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .select('*')
        .in('class_participant_id', participantIds)
        .eq('scheduled_date', selectedDate);

      if (error) {
        console.error('❌ Error fetching attendance for date:', error);
        throw error;
      }

      // Create a map for quick lookup: participantId -> confirmation data
      const confirmationsMap = new Map(
        data?.map(c => [c.class_participant_id, c]) || []
      );

      return confirmationsMap;
    },
    enabled: !!selectedDate && participantIds.length > 0,
  });
};
