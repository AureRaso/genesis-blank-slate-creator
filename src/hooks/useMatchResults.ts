
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMatchResults = (matchId?: string) => {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      
      const { data: match, error } = await supabase
        .from('matches')
        .select(`
          *,
          match_results (*),
          team1:teams!matches_team1_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (
              id,
              full_name,
              email
            ),
            player2:profiles!teams_player2_id_fkey (
              id,
              full_name,
              email
            )
          ),
          team2:teams!matches_team2_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (
              id,
              full_name,
              email
            ),
            player2:profiles!teams_player2_id_fkey (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('id', matchId)
        .single();

      if (error) {
        console.error('Error fetching match results:', error);
        throw error;
      }

      return match;
    },
    enabled: !!matchId,
  });
};

export const useUserCanSubmitResult = (matchId: string, userEmail?: string) => {
  return useQuery({
    queryKey: ['can-submit-result', matchId, userEmail],
    queryFn: async () => {
      if (!matchId || !userEmail) return false;

      const { data: match, error } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey (
            player1:profiles!teams_player1_id_fkey (email),
            player2:profiles!teams_player2_id_fkey (email)
          ),
          team2:teams!matches_team2_id_fkey (
            player1:profiles!teams_player1_id_fkey (email),
            player2:profiles!teams_player2_id_fkey (email)
          )
        `)
        .eq('id', matchId)
        .single();

      if (error || !match) return false;

      const team1Player1Email = match.team1?.player1?.email;
      const team1Player2Email = match.team1?.player2?.email;
      const team2Player1Email = match.team2?.player1?.email;
      const team2Player2Email = match.team2?.player2?.email;

      const isPlayerInMatch = team1Player1Email === userEmail || 
                             team1Player2Email === userEmail || 
                             team2Player1Email === userEmail || 
                             team2Player2Email === userEmail;

      return isPlayerInMatch && match.status === 'pending';
    },
    enabled: !!matchId && !!userEmail,
  });
};
