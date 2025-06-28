
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MatchResultData {
  matchId: string;
  team1_set1: number;
  team1_set2: number;
  team1_set3?: number;
  team2_set1: number;
  team2_set2: number;
  team2_set3?: number;
}

export const useMatchResults = (matchId?: string) => {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      
      console.log('Fetching match results for match:', matchId);
      
      const { data, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching match results:', error);
        throw error;
      }

      console.log('Match results:', data);
      return data;
    },
    enabled: !!matchId,
  });
};

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MatchResultData) => {
      console.log('Submitting match result:', data);

      // Calculate winner
      const team1Sets = [
        data.team1_set1 > data.team2_set1 ? 1 : 0,
        data.team1_set2 > data.team2_set2 ? 1 : 0,
        data.team1_set3 !== undefined && data.team2_set3 !== undefined ? (data.team1_set3 > data.team2_set3 ? 1 : 0) : 0
      ].reduce((a, b) => a + b, 0);
      
      const team2Sets = [
        data.team2_set1 > data.team1_set1 ? 1 : 0,
        data.team2_set2 > data.team1_set2 ? 1 : 0,
        data.team2_set3 !== undefined && data.team1_set3 !== undefined ? (data.team2_set3 > data.team1_set3 ? 1 : 0) : 0
      ].reduce((a, b) => a + b, 0);

      // Get match info to determine winner team ID
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('team1_id, team2_id')
        .eq('id', data.matchId)
        .single();

      if (matchError) throw matchError;

      const winner_team_id = team1Sets > team2Sets ? match.team1_id : match.team2_id;
      const points_team1 = team1Sets > team2Sets ? 3 : 0;
      const points_team2 = team2Sets > team1Sets ? 3 : 0;

      // Insert match result
      const { data: result, error } = await supabase
        .from('match_results')
        .insert({
          match_id: data.matchId,
          team1_set1: data.team1_set1,
          team1_set2: data.team1_set2,
          team1_set3: data.team1_set3,
          team2_set1: data.team2_set1,
          team2_set2: data.team2_set2,
          team2_set3: data.team2_set3,
          winner_team_id,
          points_team1,
          points_team2,
        })
        .select()
        .single();

      if (error) throw error;

      // Update match status
      await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          result_status: 'pending_approval'
        })
        .eq('id', data.matchId);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado del partido ha sido enviado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error submitting match result:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el resultado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useCanSubmitResult = (matchId: string, userEmail: string) => {
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

      if (error) return false;

      // Check if user is part of either team
      const team1Player1Email = match.team1?.player1?.[0]?.email;
      const team1Player2Email = match.team1?.player2?.[0]?.email;
      const team2Player1Email = match.team2?.player1?.[0]?.email;
      const team2Player2Email = match.team2?.player2?.[0]?.email;
      
      return team1Player1Email === userEmail || 
             team1Player2Email === userEmail || 
             team2Player1Email === userEmail || 
             team2Player2Email === userEmail;
    },
    enabled: !!matchId && !!userEmail,
  });
};
