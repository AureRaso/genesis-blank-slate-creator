import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubmitMatchResultParams {
  matchId: string;
  team1Set1: number;
  team1Set2: number;
  team1Set3?: number;
  team2Set1: number;
  team2Set2: number;
  team2Set3?: number;
  userEmail: string;
}

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: SubmitMatchResultParams) => {
      const { matchId, team1Set1, team1Set2, team1Set3, team2Set1, team2Set2, team2Set3, userEmail } = params;
      
      console.log('Submitting match result:', params);

      // First, get the match to determine which team the user belongs to
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
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Check if user is part of either team
      const team1Player1Email = Array.isArray(match.team1?.player1) ? match.team1.player1[0]?.email : match.team1?.player1?.email;
      const team1Player2Email = Array.isArray(match.team1?.player2) ? match.team1.player2[0]?.email : match.team1?.player2?.email;
      const team2Player1Email = Array.isArray(match.team2?.player1) ? match.team2.player1[0]?.email : match.team2?.player1?.email;
      const team2Player2Email = Array.isArray(match.team2?.player2) ? match.team2.player2[0]?.email : match.team2?.player2?.email;
      
      const isTeam1Player = team1Player1Email === userEmail || team1Player2Email === userEmail;
      const isTeam2Player = team2Player1Email === userEmail || team2Player2Email === userEmail;

      if (!isTeam1Player && !isTeam2Player) {
        throw new Error('No tienes permisos para subir resultados de este partido');
      }

      // Determine the winning team based on sets won
      let team1SetsWon = 0;
      let team2SetsWon = 0;

      if (team1Set1 > team2Set1) team1SetsWon++;
      else team2SetsWon++;

      if (team1Set2 > team2Set2) team1SetsWon++;
      else team2SetsWon++;

      if (team1Set3 !== undefined && team2Set3 !== undefined) {
        if (team1Set3 > team2Set3) team1SetsWon++;
        else team2SetsWon++;
      }

      let winnerTeamId: string | null = null;
      if (team1SetsWon > team2SetsWon) {
        winnerTeamId = match.team1_id;
      } else {
        winnerTeamId = match.team2_id;
      }

      // Insert the match result
      const { data, error } = await supabase
        .from('match_results')
        .insert({
          match_id: matchId,
          team1_set1: team1Set1,
          team1_set2: team1Set2,
          team1_set3: team1Set3,
          team2_set1: team2Set1,
          team2_set2: team2Set2,
          team2_set3: team2Set3,
          winner_team_id: winnerTeamId,
          // You might want to calculate points based on your league rules
          points_team1: 0,
          points_team2: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting match result:', error);
        throw error;
      }

      // Update match status to 'pending_confirmation' or similar
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'pending_confirmation',
          result_status: 'pending',
        })
        .eq('id', matchId);

      if (updateError) {
        console.error('Error updating match status:', updateError);
        throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado ha sido enviado y está pendiente de confirmación del equipo contrario.",
      });
    },
    onError: (error: Error) => {
      console.error('Error submitting match result:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el resultado.",
        variant: "destructive",
      });
    },
  });
};
