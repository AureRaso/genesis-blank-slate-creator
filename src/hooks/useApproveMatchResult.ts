
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

      // Obtener información del partido con consulta corregida
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (id, email, full_name),
            player2:profiles!teams_player2_id_fkey (id, email, full_name)
          ),
          team2:teams!matches_team2_id_fkey (
            id,
            name,
            player1:profiles!teams_player1_id_fkey (id, email, full_name),
            player2:profiles!teams_player2_id_fkey (id, email, full_name)
          )
        `)
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        console.error('Error fetching match for approval:', matchError);
        throw new Error('No se pudo obtener la información del partido');
      }

      console.log('Match fetched for approval:', match);

      // Verificar que el usuario puede aprobar/disputar - acceso directo a emails
      const team1Emails = [
        match.team1?.player1?.email, 
        match.team1?.player2?.email
      ].filter(Boolean);
      
      const team2Emails = [
        match.team2?.player1?.email, 
        match.team2?.player2?.email
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
