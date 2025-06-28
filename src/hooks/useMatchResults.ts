import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMatchResults = (matchId?: string) => {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      
      console.log('Fetching match results for match:', matchId);
      
      const { data: match, error } = await supabase
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
          match_results (*)
        `)
        .eq('id', matchId)
        .single();

      if (error) {
        console.error('Error fetching match results:', error);
        throw error;
      }

      console.log('Match results fetched:', match);
      return match;
    },
    enabled: !!matchId,
  });
};

export const useCanUserEditMatch = (matchId: string, userEmail: string) => {
  return useQuery({
    queryKey: ['can-edit-match', matchId, userEmail],
    queryFn: async () => {
      if (!matchId || !userEmail) return false;
      
      const { data: match } = await supabase
        .from('matches')
        .select(`
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
        .single();

      if (!match) return false;

      // Check if user is part of either team
      const team1Player1Email = match.team1?.player1?.email;
      const team1Player2Email = match.team1?.player2?.email;
      const team2Player1Email = match.team2?.player1?.email;
      const team2Player2Email = match.team2?.player2?.email;
      
      return team1Player1Email === userEmail || 
             team1Player2Email === userEmail || 
             team2Player1Email === userEmail || 
             team2Player2Email === userEmail;
    },
    enabled: !!matchId && !!userEmail,
  });
};

export const useUpdateMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      console.log('Updating match result:', id, updates);
      const { data, error } = await supabase
        .from('match_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating match result:', error);
        throw error;
      }

      console.log('Match result updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado actualizado",
        description: "El resultado del partido ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating match result:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el resultado del partido.",
        variant: "destructive",
      });
    },
  });
};

export const useCreateMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (matchResult: any) => {
      console.log('Creating match result:', matchResult);
      const { data, error } = await supabase
        .from('match_results')
        .insert(matchResult)
        .select()
        .single();

      if (error) {
        console.error('Error creating match result:', error);
        throw error;
      }

      console.log('Match result created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado creado",
        description: "El resultado del partido ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating match result:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el resultado del partido.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting match result:', id);
      const { data, error } = await supabase
        .from('match_results')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deleting match result:', error);
        throw error;
      }

      console.log('Match result deleted:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      toast({
        title: "Resultado eliminado",
        description: "El resultado del partido ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting match result:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el resultado del partido.",
        variant: "destructive",
      });
    },
  });
};

export const useApproveMatchResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ matchId, approve }: { matchId: string; approve: boolean }) => {
      console.log('Approving match result:', matchId, approve);
      
      const status = approve ? 'approved' : 'disputed';
      
      const { data, error } = await supabase
        .from('matches')
        .update({ 
          result_status: status,
          status: approve ? 'completed' : 'pending'
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Error approving match result:', error);
        throw error;
      }

      console.log('Match result approved:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-results'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: variables.approve ? "Resultado aprobado" : "Resultado disputado",
        description: variables.approve 
          ? "El resultado del partido ha sido aprobado." 
          : "El resultado ha sido marcado como disputado.",
      });
    },
    onError: (error) => {
      console.error('Error approving match result:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la aprobación del resultado.",
        variant: "destructive",
      });
    },
  });
};
