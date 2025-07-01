
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
      console.log('Fetching clubs with active classes...');
      
      // First get all clubs
      const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('*');

      if (clubsError) {
        console.error('Error fetching clubs:', clubsError);
        throw clubsError;
      }

      console.log('Clubs fetched:', clubs);

      // Then get all active class slots with their reservations
      const { data: classSlots, error: slotsError } = await supabase
        .from('class_slots')
        .select(`
          id,
          club_id,
          max_players,
          is_active,
          class_reservations!inner(
            id,
            status
          )
        `)
        .eq('is_active', true);

      if (slotsError) {
        console.error('Error fetching class slots:', slotsError);
        throw slotsError;
      }

      console.log('Active class slots fetched:', classSlots);

      // Also get class slots without any reservations
      const { data: slotsWithoutReservations, error: emptyError } = await supabase
        .from('class_slots')
        .select('id, club_id, max_players, is_active')
        .eq('is_active', true);

      if (emptyError) {
        console.error('Error fetching empty slots:', emptyError);
        throw emptyError;
      }

      // Process data to calculate statistics
      const clubsWithStats: ClubWithStats[] = clubs.map(club => {
        // Get all active slots for this club
        const clubSlots = slotsWithoutReservations.filter(slot => slot.club_id === club.id);
        
        let totalAvailableSpots = 0;

        clubSlots.forEach(slot => {
          // Count reserved spots for this slot
          const slotsWithReservations = classSlots.filter(s => s.id === slot.id);
          const reservedSpots = slotsWithReservations.reduce((count, s) => {
            return count + (s.class_reservations?.filter(r => r.status === 'reservado').length || 0);
          }, 0);
          
          const availableSpots = slot.max_players - reservedSpots;
          totalAvailableSpots += Math.max(0, availableSpots);
        });

        return {
          id: club.id,
          name: club.name,
          address: club.address,
          court_count: club.court_count,
          court_types: club.court_types,
          description: club.description,
          active_classes_count: clubSlots.length,
          available_spots: totalAvailableSpots
        };
      }).filter(club => club.available_spots > 0); // Only clubs with available spots

      console.log('Clubs with stats:', clubsWithStats);
      return clubsWithStats;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
};
