
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/padel';
import { toast } from '@/hooks/use-toast';

export const usePlayers = (clubId?: string) => {
  return useQuery({
    queryKey: ['players', clubId],
    queryFn: async () => {
      // Get current user to check if they're an admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No authenticated user');

      // Get user profile to check role and club
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, id, club_id')
        .eq('id', currentUser.user.id)
        .single();

      let clubIds: string[] = [];

      // If specific clubId provided, use it
      if (clubId) {
        clubIds = [clubId];
      } else if (profile?.role === 'superadmin') {
        // Superadmin with no specific club selected - get ALL their assigned clubs
        const { data: superadminClubs, error: superadminClubsError } = await supabase
          .from('admin_clubs')
          .select('club_id')
          .eq('admin_profile_id', currentUser.user.id);

        if (superadminClubsError) throw superadminClubsError;

        if (!superadminClubs || superadminClubs.length === 0) {
          return [];
        }

        clubIds = superadminClubs.map(ac => ac.club_id);
      } else if (profile?.role === 'admin' && profile.club_id) {
        // Admin with a club assigned, filter players by their club
        clubIds = [profile.club_id];
      } else if (profile?.role === 'admin' && !profile.club_id) {
        // Admin without club assigned, try to get clubs they created
        const { data: adminClubs } = await supabase
          .from('clubs')
          .select('id')
          .eq('created_by_profile_id', profile.id);

        if (adminClubs && adminClubs.length > 0) {
          clubIds = adminClubs.map(club => club.id);
        } else {
          // Admin has no clubs, return empty array
          return [];
        }
      }

      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          level,
          created_at,
          role,
          club_id,
          clubs!club_id(name, status)
        `)
        .eq('role', 'player')
        .order('created_at', { ascending: false });

      // Filter by clubs if we have club IDs
      if (clubIds.length > 0) {
        query = query.in('club_id', clubIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching players:', error);
        throw error;
      }

      // Transform data to match Player interface
      const players = (data || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Sin nombre',
        email: profile.email || '',
        level: profile.level || 3,
        club_id: profile.club_id,
        club_name: profile.clubs?.name || (profile.club_id ? 'Club desconocido' : 'Sin club'),
        club_status: profile.clubs?.status || null,
        created_at: profile.created_at
      })) as (Player & {
        club_id?: string;
        club_name?: string;
        club_status?: string;
      })[];

      return players;
    },
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; email?: string; level?: number; club_id?: string }) => {
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.email) profileUpdates.email = updates.email;
      if (updates.level !== undefined) profileUpdates.level = updates.level;
      if (updates.club_id !== undefined) profileUpdates.club_id = updates.club_id || null;

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Jugador actualizado",
        description: "Los datos del jugador han sido actualizados correctamente",
      });
    },
    onError: (error: any) => {
      let message = "No se pudo actualizar el jugador";
      if (error.message?.includes('row-level security')) {
        message = "No tienes permisos para actualizar jugadores";
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Jugador eliminado",
        description: "El jugador ha sido eliminado del sistema",
      });
    },
    onError: (error: any) => {
      let message = "No se pudo eliminar el jugador";
      if (error.message?.includes('row-level security')) {
        message = "No tienes permisos para eliminar jugadores";
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });
};
