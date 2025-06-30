
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useApproveMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ matchId, approve }: { matchId: string; approve: boolean }) => {
      if (!user?.email) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Fetching match for approval:', matchId);

      // Obtener información del partido primero
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
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

      console.log('Match data constructed for approval');

      // Verificar que el usuario puede aprobar/disputar
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
      
      let approvingTeamId: string;
      
      // Solo puede aprobar el equipo que NO envió el resultado
      if (match.result_submitted_by_team_id === match.team1_id && team2Emails.includes(user.email)) {
        approvingTeamId = match.team2_id;
      } else if (match.result_submitted_by_team_id === match.team2_id && team1Emails.includes(user.email)) {
        approvingTeamId = match.team1_id;
      } else {
        throw new Error('No tienes permisos para aprobar este resultado');
      }

      // Actualizar el estado según la decisión
      const newStatus = approve ? 'approved' : 'disputed';
      const updateData = approve 
        ? { 
            result_status: newStatus,
            result_approved_by_team_id: approvingTeamId,
            status: 'completed'
          }
        : { 
            result_status: newStatus 
          };

      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);

      if (updateError) {
        throw updateError;
      }

      return { success: true, approved: approve };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['league-standings'] });
      
      if (data.approved) {
        toast({
          title: "Resultado aprobado",
          description: "El resultado ha sido confirmado y el partido está completo.",
        });
      } else {
        toast({
          title: "Resultado disputado",
          description: "El resultado ha sido disputado. Se requiere intervención de un administrador.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error approving/disputing result:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la acción.",
        variant: "destructive",
      });
    },
  });
};
