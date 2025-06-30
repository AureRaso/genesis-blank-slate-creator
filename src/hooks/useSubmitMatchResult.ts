
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: MatchResultData) => {
      if (!user?.email) {
        throw new Error('Usuario no autenticado');
      }

      if (!data.matchId) {
        throw new Error('ID del partido no válido');
      }

      console.log('Submitting result for match:', data.matchId);

      // Validar que todos los valores sean números válidos
      const scores = [
        data.team1_set1, data.team1_set2, data.team2_set1, data.team2_set2
      ];
      
      if (data.team1_set3 !== undefined) scores.push(data.team1_set3);
      if (data.team2_set3 !== undefined) scores.push(data.team2_set3);

      const hasInvalidScores = scores.some(score => 
        isNaN(Number(score)) || Number(score) < 0 || Number(score) > 7
      );

      if (hasInvalidScores) {
        throw new Error('Todos los valores de sets deben ser números válidos entre 0 y 7');
      }

      // Obtener información del partido
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
        console.error('Error fetching match:', matchError);
        throw new Error('No se pudo obtener la información del partido');
      }

      console.log('Match data:', match);

      // Determinar qué equipo está enviando el resultado - acceso correcto a emails
      const team1Emails = [
        match.team1?.player1?.email, 
        match.team1?.player2?.email
      ].filter(Boolean);
      
      const team2Emails = [
        match.team2?.player1?.email, 
        match.team2?.player2?.email
      ].filter(Boolean);
      
      let submittingTeamId: string;
      if (team1Emails.includes(user.email)) {
        submittingTeamId = match.team1_id;
      } else if (team2Emails.includes(user.email)) {
        submittingTeamId = match.team2_id;
      } else {
        throw new Error('No tienes permisos para subir el resultado de este partido');
      }

      // Calcular el ganador
      const team1Sets = (data.team1_set1 > data.team2_set1 ? 1 : 0) +
                       (data.team1_set2 > data.team2_set2 ? 1 : 0) +
                       (data.team1_set3 !== undefined && data.team2_set3 !== undefined ? (data.team1_set3 > data.team2_set3 ? 1 : 0) : 0);

      const team2Sets = (data.team2_set1 > data.team1_set1 ? 1 : 0) +
                       (data.team2_set2 > data.team1_set2 ? 1 : 0) +
                       (data.team1_set3 !== undefined && data.team2_set3 !== undefined ? (data.team2_set3 > data.team1_set3 ? 1 : 0) : 0);

      const winner_team_id = team1Sets > team2Sets ? match.team1_id : match.team2_id;
      const points_team1 = team1Sets > team2Sets ? 3 : 0;
      const points_team2 = team2Sets > team1Sets ? 3 : 0;

      console.log('Creating match result:', {
        match_id: data.matchId,
        winner_team_id,
        points_team1,
        points_team2,
        submittingTeamId
      });

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

      // Actualizar el estado del partido - resultado enviado, esperando confirmación
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          result_status: 'submitted',
          result_submitted_by_team_id: submittingTeamId
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
        description: "El resultado ha sido enviado y está esperando confirmación del otro equipo.",
      });
    },
    onError: (error) => {
      console.error('Error submitting match result:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el resultado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
