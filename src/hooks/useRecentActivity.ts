import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActivityType = 'player_registered' | 'class_scheduled' | 'league_updated' | 'match_scheduled' | 'trainer_assigned';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  created_at: string;
  club_id?: string;
}

export const useRecentActivity = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['recent-activity', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const activities: Activity[] = [];
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Get admin's club_id (either assigned or created clubs)
      const adminClubId = profile.club_id;

      // Fetch recent players (last 3 days)
      const { data: recentPlayers } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, club_id')
        .eq('role', 'player')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Filter players by admin's club
      const filteredPlayers = recentPlayers?.filter(player => {
        if (!adminClubId) return false;
        return player.club_id === adminClubId;
      }) || [];

      filteredPlayers.forEach(player => {
        activities.push({
          id: `player-${player.id}`,
          type: 'player_registered',
          description: `Nuevo jugador registrado: ${player.full_name || 'Sin nombre'}`,
          created_at: player.created_at,
          club_id: player.club_id || undefined,
        });
      });

      // Fetch recent classes (last 3 days)
      const { data: recentClasses } = await supabase
        .from('programmed_classes')
        .select('id, created_at, club_id, class_type')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Filter classes by admin's club
      const filteredClasses = recentClasses?.filter(classItem => {
        if (!adminClubId) return false;
        return classItem.club_id === adminClubId;
      }) || [];

      filteredClasses.forEach(classItem => {
        activities.push({
          id: `class-${classItem.id}`,
          type: 'class_scheduled',
          description: `Nueva clase programada: ${classItem.class_type || 'Clase'}`,
          created_at: classItem.created_at,
          club_id: classItem.club_id,
        });
      });

      // Fetch recent trainers (last 3 days)
      const { data: recentTrainers } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, club_id')
        .eq('role', 'trainer')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Filter trainers by admin's club
      const filteredTrainers = recentTrainers?.filter(trainer => {
        if (!adminClubId) return false;
        return trainer.club_id === adminClubId;
      }) || [];

      filteredTrainers.forEach(trainer => {
        activities.push({
          id: `trainer-${trainer.id}`,
          type: 'trainer_assigned',
          description: `Nuevo entrenador asignado: ${trainer.full_name || 'Sin nombre'}`,
          created_at: trainer.created_at,
          club_id: trainer.club_id || undefined,
        });
      });

      // Sort all activities by created_at descending
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Return top 5 activities
      return activities.slice(0, 5);
    },
    enabled: !!profile,
  });
};
