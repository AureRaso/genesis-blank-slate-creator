
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

      // Obtener información del partido primero
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', data.matchId)
        .single();

      if (matchError || !match) {
        console.error('Error fetching match:', matchError);
        throw new Error('No se pudo obtener la información del partido');
      }

      // Obtener información de los teams por separado
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, player1_id, player2_id')
        .in('id', [match.team1_id, match.team2_id]);

      if (teamsError || !teams) {
        console.error('Error fetching teams:', teamsError);
        throw new Error('No se pudo obtener la información de los equipos');
      }

      // Obtener todos los player IDs
      const playerIds = teams.flatMap(team => [team.player1_id, team.player2_id]).filter(Boolean);
      
      const { data: players, error: playersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', playerIds);

      if (playersError || !players) {
        console.error('Error fetching players:', playersError);
        throw new Error('No se pudo obtener la información de los jugadores');
      }

      // Construir estructura de datos
      const playersMap = new Map(players.map(p => [p.id, p]));
      const team1 = teams.find(t => t.id === match.team1_id);
      const team2 = teams.find(t => t.id === match.team2_id);

      if (!team1 || !team2) {
        throw new Error('No se pudieron encontrar los equipos del partido');
      }

      console.log('Match data constructed successfully');

      // Determinar qué equipo está enviando el resultado
      const team1Emails = [
        playersMap.get(team1.player1_id)?.email,
        playersMap.get(team1.player2_id)?.email
      ].filter(Boolean);
      
      const team2Emails = [
        playersMap.get(team2.player1_id)?.email,
        playersMap.get(team2.player2_id)?.email
      ].filter(Boolean);
      
      console.log('Team 1 emails:', team1Emails);
      console.log('Team 2 emails:', team2Emails);
      console.log('Current user email:', user.email);
      
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
