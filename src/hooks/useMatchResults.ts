
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

export const useApproveMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ matchId, approve }: { matchId: string; approve: boolean }) => {
      if (!user?.email) throw new Error('Usuario no autenticado');

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
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Verificar que el usuario pertenece al equipo que NO envió el resultado
      const team1Emails = [match.team1.player1.email, match.team1.player2.email];
      const team2Emails = [match.team2.player1.email, match.team2.player2.email];
      
      let approvingTeamId: string;
      if (match.result_submitted_by_team_id === match.team1_id && team2Emails.includes(user.email)) {
        approvingTeamId = match.team2_id;
      } else if (match.result_submitted_by_team_id === match.team2_id && team1Emails.includes(user.email)) {
        approvingTeamId = match.team1_id;
      } else {
        throw new Error('No tienes permiso para aprobar este resultado');
      }

      // Actualizar el estado del partido
      const newStatus = approve ? 'approved' : 'disputed';
      const updates: any = {
        result_status: newStatus,
        result_approved_by_team_id: approvingTeamId
      };

      if (approve) {
        updates.status = 'completed';
      }

      const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);

      if (error) throw error;

      return { matchId, approved: approve };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: data.approved ? "Resultado aprobado" : "Resultado disputado",
        description: data.approved 
          ? "El resultado ha sido confirmado y el partido está completo."
          : "El resultado ha sido disputado. Se requiere resolución manual.",
      });
    },
    onError: (error: Error) => {
      console.error('Error approving match result:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
