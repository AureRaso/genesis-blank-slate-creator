
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeagueRegistrationData {
  league_id: string;
  profile_id: string;
}

export const useLeagueRegistration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LeagueRegistrationData) => {
      console.log('Registering for league:', data);
      
      // Check if already registered
      const { data: existing, error: checkError } = await supabase
        .from('league_players')
        .select('id')
        .eq('league_id', data.league_id)
        .eq('profile_id', data.profile_id)
        .single();

      if (existing && !checkError) {
        throw new Error('Ya estás registrado en esta liga');
      }

      const { data: result, error } = await supabase
        .from('league_players')
        .insert([{
          league_id: data.league_id,
          profile_id: data.profile_id,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error registering for league:', error);
        throw error;
      }

      console.log('League registration successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-leagues'] });
      queryClient.invalidateQueries({ queryKey: ['player-available-leagues'] });
      queryClient.invalidateQueries({ queryKey: ['league-players'] });
      toast({
        title: "Inscripción exitosa",
        description: "Te has inscrito en la liga correctamente. Tu solicitud está pendiente de aprobación.",
      });
    },
    onError: (error: Error) => {
      console.error('Error in league registration:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo inscribir en la liga. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};
