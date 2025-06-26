
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MatchResult, League } from '@/types/padel';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useSubmitMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (result: Omit<MatchResult, 'id' | 'created_at'>) => {
      console.log('Submitting match result:', result);
      
      if (!user?.email) throw new Error('Usuario no autenticado');

      // Obtener información del partido y usuario
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          league:leagues!matches_league_id_fkey (*),
          team1:teams!matches_team1_id_fkey (
            id,
            player1:players!teams_player1_id_fkey (email),
            player2:players!teams_player2_id_fkey (email)
          ),
          team2:teams!matches_team2_id_fkey (
            id,
            player1:players!teams_player1_id_fkey (email),
            player2:players!teams_player2_id_fkey (email)
          )
        `)
        .eq('id', result.match_id)
        .single();

      if (matchError) throw matchError;

      // Verificar que el usuario pertenece a uno de los equipos
      const team1Emails = [match.team1.player1.email, match.team1.player2.email];
      const team2Emails = [match.team2.player1.email, match.team2.player2.email];
      
      let submittingTeamId: string;
      if (team1Emails.includes(user.email)) {
        submittingTeamId = match.team1_id;
      } else if (team2Emails.includes(user.email)) {
        submittingTeamId = match.team2_id;
      } else {
        throw new Error('No tienes permiso para subir resultados de este partido');
      }

      const league = match.league as League;

      // Calcular puntos basado en las reglas de la liga
      let points_team1 = 0;
      let points_team2 = 0;

      if (result.winner_team_id === match.team1_id) {
        points_team1 = league.points_victory;
        points_team2 = league.points_defeat;
      } else {
        points_team1 = league.points_defeat;
        points_team2 = league.points_victory;
      }

      if (league.points_per_set) {
        const team1Sets = 
          (result.team1_set1 > result.team2_set1 ? 1 : 0) +
          (result.team1_set2 > result.team2_set2 ? 1 : 0) +
          (result.team1_set3 && result.team2_set3 ? (result.team1_set3 > result.team2_set3 ? 1 : 0) : 0);
        
        const team2Sets = 
          (result.team2_set1 > result.team1_set1 ? 1 : 0) +
          (result.team2_set2 > result.team1_set2 ? 1 : 0) +
          (result.team2_set3 && result.team1_set3 ? (result.team2_set3 > result.team1_set3 ? 1 : 0) : 0);

        points_team1 += team1Sets;
        points_team2 += team2Sets;
      }

      const resultWithPoints = {
        ...result,
        points_team1,
        points_team2,
      };

      // Crear el resultado
      const { data, error } = await supabase
        .from('match_results')
        .insert([resultWithPoints])
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado del partido
      await supabase
        .from('matches')
        .update({ 
          result_status: 'submitted',
          result_submitted_by_team_id: submittingTeamId
        })
        .eq('id', result.match_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-results', variables.match_id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Resultado enviado",
        description: "El resultado ha sido enviado. Esperando confirmación del equipo contrario.",
      });
    },
    onError: (error: Error) => {
      console.error('Error submitting match result:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
