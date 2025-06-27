
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useCanCreateMatch = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['can-create-match', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      
      // Llamar a la función que verifica si puede crear un partido
      const { data, error } = await supabase
        .rpc('can_create_match_this_week', { profile_id: profile.id });

      if (error) {
        console.error('Error checking match creation:', error);
        return false;
      }

      return data;
    },
    enabled: !!profile?.id,
  });
};

export const useCreatePlayerMatch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      leagueId, 
      team1Id, 
      team2Id, 
      scheduledDate, 
      scheduledTime 
    }: {
      leagueId: string;
      team1Id: string;
      team2Id: string;
      scheduledDate?: string;
      scheduledTime?: string;
    }) => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      // Verificar que puede crear un partido
      const { data: canCreate } = await supabase
        .rpc('can_create_match_this_week', { profile_id: profile.id });

      if (!canCreate) {
        throw new Error('Ya has creado un partido esta semana');
      }

      // Crear el partido
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          league_id: leagueId,
          team1_id: team1Id,
          team2_id: team2Id,
          round: 1, // Los partidos creados por jugadores empiezan en ronda 1
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          created_by_profile_id: profile.id,
          status: 'pending',
          result_status: 'pending'
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Registrar la creación del partido
      await supabase.rpc('record_match_creation', { profile_id: profile.id });

      return match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['can-create-match'] });
      toast({
        title: "Partido creado",
        description: "El partido ha sido creado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
