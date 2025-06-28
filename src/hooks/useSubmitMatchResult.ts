
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubmitMatchResultParams {
  matchId: string;
  team1Set1: number;
  team1Set2: number;
  team1Set3?: number;
  team2Set1: number;
  team2Set2: number;
  team2Set3?: number;
  winnerTeamId: string;
  pointsTeam1: number;
  pointsTeam2: number;
}

export const useCanUserSubmitResult = (matchId: string, userEmail: string) => {
  return useQuery({
    queryKey: ['can-submit-result', matchId, userEmail],
    queryFn: async () => {
      if (!matchId || !userEmail) return false;
      
      const { data: match } = await supabase
        .from('matches')
        .select(`
          result_status,
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

      if (!match || match.result_status !== 'pending') return false;

      // Check if user is part of either team
      const team1Player1Email = match.team1?.player1?.email;
      const team1Player2Email = match.team1?.player2?.email;
      const team2Player1Email = match.team2?.player1?.email;
      const team2Player2Email = match.team2?.player2?.email;
      
      return team1Player1Email === userEmail || 
             team1Player2Email === userEmail || 
             team2Player1Email === userEmail || 
             team2Player2Email === userEmail;
    },
    enabled: !!matchId && !!userEmail,
  });
};

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: SubmitMatchResultParams) => {
      console.log('Submitting match result:', params);

      // First, create the match result
      const resultData = {
        match_id: params.matchId,
        team1_set1: params.team1Set1,
        team1_set2: params.team1Set2,
        team1_set3: params.team1Set3 || null,
        team2_set1: params.team2Set1,
        team2_set2: params.team2Set2,
        team2_set3: params.team2Set3 || null,
        winner_team_id: params.winnerTeamId,
        points_team1: params.pointsTeam1,
        points_team2: params.pointsTeam2,
      };

      const { data: result, error: resultError } = await supabase
        .from('match_results')
        .insert(resultData)
        .select()
        .single();

      if (resultError) {
        console.error('Error creating match result:', resultError);
        throw resultError;
      }

      // Then, update the match status
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .update({
          result_status: 'submitted',
          status: 'completed'
        })
        .eq('id', params.matchId)
        .select()
        .single();

      if (matchError) {
        console.error('Error updating match:', matchError);
        throw matchError;
      }

      console.log('Match result submitted successfully');
      return { result, match };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado ha sido enviado y está esperando aprobación del otro equipo.",
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
