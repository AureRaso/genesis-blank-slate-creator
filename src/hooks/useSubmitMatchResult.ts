
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SubmitMatchResultParams {
  matchId: string;
  team1Set1: number;
  team1Set2: number;
  team1Set3?: number | null;
  team2Set1: number;
  team2Set2: number;
  team2Set3?: number | null;
  winnerTeamId: string;
}

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: SubmitMatchResultParams) => {
      if (!user?.email) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Submitting match result:', params);

      // First, check if user can submit result for this match
      const { data: match, error: matchError } = await supabase
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
        .eq('id', params.matchId)
        .single();

      if (matchError) {
        console.error('Error fetching match:', matchError);
        throw matchError;
      }

      // Check if user is part of either team
      const team1Player1Email = match.team1?.player1?.email;
      const team1Player2Email = match.team1?.player2?.email;
      const team2Player1Email = match.team2?.player1?.email;
      const team2Player2Email = match.team2?.player2?.email;
      
      const userIsInMatch = team1Player1Email === user.email || 
                           team1Player2Email === user.email || 
                           team2Player1Email === user.email || 
                           team2Player2Email === user.email;

      if (!userIsInMatch) {
        throw new Error('No tienes permisos para subir el resultado de este partido');
      }

      // Determine which team the user belongs to
      const userTeamId = (team1Player1Email === user.email || team1Player2Email === user.email) 
        ? match.team1_id 
        : match.team2_id;

      // Calculate points based on sets won
      let team1Points = 0;
      let team2Points = 0;

      // Count sets won
      let team1SetsWon = 0;
      let team2SetsWon = 0;

      if (params.team1Set1 > params.team2Set1) team1SetsWon++;
      else team2SetsWon++;

      if (params.team1Set2 > params.team2Set2) team1SetsWon++;
      else team2SetsWon++;

      if (params.team1Set3 !== null && params.team2Set3 !== null) {
        if (params.team1Set3 > params.team2Set3) team1SetsWon++;
        else team2SetsWon++;
      }

      // Basic point system (can be enhanced based on league rules)
      if (team1SetsWon > team2SetsWon) {
        team1Points = 3;
        team2Points = 1;
      } else {
        team1Points = 1;
        team2Points = 3;
      }

      // Insert match result
      const { data: result, error: resultError } = await supabase
        .from('match_results')
        .insert({
          match_id: params.matchId,
          team1_set1: params.team1Set1,
          team1_set2: params.team1Set2,
          team1_set3: params.team1Set3,
          team2_set1: params.team2Set1,
          team2_set2: params.team2Set2,
          team2_set3: params.team2Set3,
          winner_team_id: params.winnerTeamId,
          points_team1: team1Points,
          points_team2: team2Points,
        })
        .select()
        .single();

      if (resultError) {
        console.error('Error inserting match result:', resultError);
        throw resultError;
      }

      // Update match status
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'completed',
          result_status: 'submitted',
          result_submitted_by_team_id: userTeamId,
        })
        .eq('id', params.matchId);

      if (updateError) {
        console.error('Error updating match status:', updateError);
        throw updateError;
      }

      console.log('Match result submitted successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado ha sido enviado y está pendiente de aprobación.",
      });
    },
    onError: (error: any) => {
      console.error('Error submitting match result:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el resultado.",
        variant: "destructive",
      });
    },
  });
};
