import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/types/padel';
import { useToast } from '@/hooks/use-toast';

export const useMatches = (leagueId?: string) => {
  return useQuery({
    queryKey: ['matches', leagueId],
    queryFn: async () => {
      console.log('Fetching matches for league:', leagueId);
      
      let query = supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (id, full_name, email),
            player2:profiles!teams_player2_id_fkey (id, full_name, email)
          ),
          team2:teams!matches_team2_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (id, full_name, email),
            player2:profiles!teams_player2_id_fkey (id, full_name, email)
          ),
          league:leagues!matches_league_id_fkey (id, name),
          match_results (*)
        `)
        .order('round', { ascending: true })
        .order('created_at', { ascending: true });

      if (leagueId) {
        query = query.eq('league_id', leagueId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }

      console.log('Matches fetched:', data);
      return data;
    },
    enabled: !!leagueId || leagueId === undefined,
  });
};

export const useCreateMatches = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leagueId, teamIds }: { leagueId: string; teamIds: string[] }) => {
      console.log('Creating matches for league:', leagueId, 'with teams:', teamIds);
      
      // Generate Round Robin matches
      const matches = [];
      let round = 1;
      
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          matches.push({
            league_id: leagueId,
            team1_id: teamIds[i],
            team2_id: teamIds[j],
            round: Math.ceil(matches.length / Math.floor(teamIds.length / 2)) || 1,
            status: 'pending'
          });
        }
      }

      const { data, error } = await supabase
        .from('matches')
        .insert(matches)
        .select();

      if (error) {
        console.error('Error creating matches:', error);
        throw error;
      }

      console.log('Matches created:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches', variables.leagueId] });
      toast({
        title: "Partidos creados",
        description: "Los partidos de la liga han sido generados exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating matches:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear los partidos.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Match> & { id: string }) => {
      console.log('Updating match:', id, updates);
      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating match:', error);
        throw error;
      }

      console.log('Match updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Partido actualizado",
        description: "El partido ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating match:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el partido.",
        variant: "destructive",
      });
    },
  });
};
