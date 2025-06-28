
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MatchResultData {
  team1_set1: number;
  team1_set2: number;
  team1_set3?: number;
  team2_set1: number;
  team2_set2: number;
  team2_set3?: number;
}

export const useMatchResults = (matchId?: string) => {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      
      const { data, error } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching match result:', error);
        throw error;
      }

      return data;
    },
    enabled: !!matchId,
  });
};

export const useCanUserSubmitResult = (matchId: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['can-submit-result', matchId, profile?.id],
    queryFn: async () => {
      if (!matchId || !profile?.id) return false;
      
      // Obtener información del partido
      const { data: match, error } = await supabase
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
        .eq('id', matchId)
        .maybeSingle();

      if (error) {
        console.error('Error checking match permissions:', error);
        return false;
      }

      // Verificar si el usuario es parte de alguno de los equipos
      const userEmail = profile.email;
      const team1Player1Email = match.team1?.player1?.email;
      const team1Player2Email = match.team1?.player2?.email;
      const team2Player1Email = match.team2?.player1?.email;
      const team2Player2Email = match.team2?.player2?.email;

      const isInTeam1 = userEmail === team1Player1Email || userEmail === team1Player2Email;
      const isInTeam2 = userEmail === team2Player1Email || userEmail === team2Player2Email;

      return isInTeam1 || isInTeam2;
    },
    enabled: !!matchId && !!profile?.id,
  });
};

export const useApproveMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ matchId, approve }: { matchId: string; approve: boolean }) => {
      const { error } = await supabase
        .from('matches')
        .update({
          result_status: approve ? 'approved' : 'disputed',
          status: approve ? 'completed' : 'pending'
        })
        .eq('id', matchId);

      if (error) {
        console.error('Error approving match result:', error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: approve ? "Resultado aprobado" : "Resultado disputado",
        description: approve 
          ? "El resultado ha sido aprobado correctamente." 
          : "El resultado ha sido marcado como disputado.",
      });
    },
    onError: (error) => {
      console.error('Error processing match result:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la acción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
