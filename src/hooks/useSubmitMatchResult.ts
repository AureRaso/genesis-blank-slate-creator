
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: SubmitMatchResultParams) => {
      console.log('Submitting match result:', params);
      
      // Get the match with team data to verify the user can submit the result
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey (
            id,
            player1:profiles!teams_player1_id_fkey (email),
            player2:profiles!teams_player2_id_fkey (email)
          ),
          team2:teams!matches_team2_id_fkey (
            id,
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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Check if user is part of either team
      const team1Player1Email = match.team1?.player1?.email;
      const team1Player2Email = match.team1?.player2?.email;
      const team2Player1Email = match.team2?.player1?.email;
      const team2Player2Email = match.team2?.player2?.email;
      
      const isUserInMatch = team1Player1Email === user.email || 
                           team1Player2Email === user.email || 
                           team2Player1Email === user.email || 
                           team2Player2Email === user.email;

      if (!isUserInMatch) {
        throw new Error('No tienes permisos para enviar el resultado de este partido');
      }

      // Determine which team the user belongs to
      const userBelongsToTeam1 = team1Player1Email === user.email || team1Player2Email === user.email;
      const submittingTeamId = userBelongsToTeam1 ? match.team1_id : match.team2_id;

      // Create or update match result
      const matchResult = {
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

      // Insert or update match result
      const { data: resultData, error: resultError } = await supabase
        .from('match_results')
        .upsert(matchResult, { 
          onConflict: 'match_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (resultError) {
        console.error('Error creating/updating match result:', resultError);
        throw resultError;
      }

      // Update match status
      const { error: matchUpdateError } = await supabase
        .from('matches')
        .update({
          result_submitted_by_team_id: submittingTeamId,
          result_status: 'pending_approval',
          status: 'pending'
        })
        .eq('id', params.matchId);

      if (matchUpdateError) {
        console.error('Error updating match status:', matchUpdateError);
        throw matchUpdateError;
      }

      return resultData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado del partido ha sido enviado y está pendiente de aprobación.",
      });
    },
    onError: (error: any) => {
      console.error('Error submitting match result:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el resultado del partido.",
        variant: "destructive",
      });
    },
  });
};
