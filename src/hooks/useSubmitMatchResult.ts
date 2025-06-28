
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MatchResultData {
  matchId: string;
  team1_set1: number;
  team1_set2: number;
  team1_set3?: number;
  team2_set1: number;
  team2_set2: number;
  team2_set3?: number;
}

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MatchResultData) => {
      // Primero obtener información del partido
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
        .eq('id', data.matchId)
        .single();

      if (matchError || !match) {
        throw new Error('No se pudo obtener la información del partido');
      }

      // Calcular el ganador
      const team1Sets = (data.team1_set1 > data.team2_set1 ? 1 : 0) +
                       (data.team1_set2 > data.team2_set2 ? 1 : 0) +
                       (data.team1_set3 && data.team2_set3 ? (data.team1_set3 > data.team2_set3 ? 1 : 0) : 0);

      const team2Sets = (data.team2_set1 > data.team1_set1 ? 1 : 0) +
                       (data.team2_set2 > data.team1_set2 ? 1 : 0) +
                       (data.team1_set3 && data.team2_set3 ? (data.team2_set3 > data.team1_set3 ? 1 : 0) : 0);

      const winner_team_id = team1Sets > team2Sets ? match.team1_id : match.team2_id;
      const points_team1 = team1Sets > team2Sets ? 3 : 0;
      const points_team2 = team2Sets > team1Sets ? 3 : 0;

      // Crear el resultado del partido
      const { error: resultError } = await supabase
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
        });

      if (resultError) {
        console.error('Error creating match result:', resultError);
        throw resultError;
      }

      // Actualizar el estado del partido
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          result_status: 'approved'
        })
        .eq('id', data.matchId);

      if (updateError) {
        console.error('Error updating match status:', updateError);
        throw updateError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      queryClient.invalidateQueries({ queryKey: ['league-standings'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado del partido ha sido registrado correctamente.",
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
