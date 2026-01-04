
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useActiveClubs = () => {
  return useQuery({
    queryKey: ['active-clubs'],
    queryFn: async () => {
      // Get user profile to check role
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, club_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      // Superadmin: get only their assigned clubs from admin_clubs
      if (userProfile.role === 'superadmin') {
        const { data: superadminClubs, error: superadminClubsError } = await supabase
          .from('admin_clubs')
          .select('club_id')
          .eq('admin_profile_id', userData.user.id);

        if (superadminClubsError) throw superadminClubsError;

        if (!superadminClubs || superadminClubs.length === 0) {
          return [];
        }

        const clubIds = superadminClubs.map(ac => ac.club_id);
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .in('id', clubIds)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching superadmin active clubs:', error);
          throw error;
        }

        return data || [];
      }

      // Admin: get their assigned club by club_id, or fallback to created clubs
      if (userProfile.role === 'admin') {
        // Primero: si tiene club_id asignado, usar ese
        if (userProfile.club_id) {
          const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', userProfile.club_id)
            .eq('status', 'active')
            .order('name', { ascending: true });

          if (error) {
            console.error('Error fetching admin club by club_id:', error);
            throw error;
          }

          return data || [];
        }

        // Fallback: clubs creados por el admin (para admins legacy sin club_id)
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('created_by_profile_id', userData.user.id)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching admin created clubs:', error);
          throw error;
        }

        return data || [];
      }

      // Trainer/Player: get their assigned club
      if (userProfile.club_id) {
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', userProfile.club_id)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching user club:', error);
          throw error;
        }

        return data || [];
      }

      // Fallback: return empty array (user has no club access)
      return [];
    },
  });
};
