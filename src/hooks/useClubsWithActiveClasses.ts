
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClubWithStats = {
  id: string;
  name: string;
  address: string;
  court_count: number;
  court_types: string[];
  description?: string;
  active_classes_count: number;
  available_spots: number;
};

export const useClubsWithActiveClasses = () => {
  return useQuery({
    queryKey: ['clubs-with-active-classes'],
    queryFn: async () => {
      // Obtener clubes con sus class_slots activos y reservaciones
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          address,
          court_count,
          court_types,
          description,
          class_slots!inner(
            id,
            max_players,
            is_active,
            class_reservations(
              id,
              status
            )
          )
        `)
        .eq('class_slots.is_active', true);

      if (error) throw error;

      // Procesar datos para calcular estadísticas
      const clubsWithStats: ClubWithStats[] = data.map(club => {
        const activeClasses = club.class_slots.filter(slot => slot.is_active);
        let totalAvailableSpots = 0;

        activeClasses.forEach(classSlot => {
          const reservedSpots = classSlot.class_reservations?.filter(
            reservation => reservation.status === 'reservado'
          ).length || 0;
          const availableSpots = classSlot.max_players - reservedSpots;
          totalAvailableSpots += Math.max(0, availableSpots);
        });

        return {
          id: club.id,
          name: club.name,
          address: club.address,
          court_count: club.court_count,
          court_types: club.court_types,
          description: club.description,
          active_classes_count: activeClasses.length,
          available_spots: totalAvailableSpots
        };
      }).filter(club => club.available_spots > 0); // Solo clubes con plazas disponibles

      return clubsWithStats;
    },
  });
};
