
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MatchResult, League } from '@/types/padel';
import { useToast } from '@/hooks/use-toast';

export const useMatchResults = (matchId?: string) => {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      
      console.log('Fetching match result for match:', matchId);
      const { data, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching match result:', error);
        throw error;
      }

      console.log('Match result fetched:', data);
      return data;
    },
    enabled: !!matchId,
  });
};

export const useCreateMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (result: Omit<MatchResult, 'id' | 'created_at'>) => {
      console.log('Creating match result:', result);
      
      // First, get the league info to calculate points
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          league:league_id (*)
        `)
        .eq('id', result.match_id)
        .single();

      if (matchError) {
        console.error('Error fetching match for result:', matchError);
        throw matchError;
      }

      const league = match.league as League;

      // Calculate points based on league rules
      let points_team1 = 0;
      let points_team2 = 0;

      // Determine winner and base points
      if (result.winner_team_id === match.team1_id) {
        points_team1 = league.points_victory;
        points_team2 = league.points_defeat;
      } else {
        points_team1 = league.points_defeat;
        points_team2 = league.points_victory;
      }

      // Add points per set if enabled
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

      const { data, error } = await supabase
        .from('match_results')
        .insert([resultWithPoints])
        .select()
        .single();

      if (error) {
        console.error('Error creating match result:', error);
        throw error;
      }

      // Update match status to completed
      await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', result.match_id);

      console.log('Match result created:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-results', variables.match_id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Resultado registrado",
        description: "El resultado del partido ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating match result:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el resultado del partido.",
        variant: "destructive",
      });
    },
  });
};
