
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useCanCreateMatch = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['can-create-match', profile?.id],
    queryFn: async () => {
      if (!profile?.id) {
        console.log('No profile ID available');
        return false;
      }
      
      console.log('Checking if user can create match for profile:', profile.id);
      
      // Llamar a la función que verifica si puede crear un partido
      const { data, error } = await supabase
        .rpc('can_create_match_this_week', { _profile_id: profile.id });

      if (error) {
        console.error('Error checking match creation:', error);
        return false;
      }

      console.log('Can create match result:', data);
      return data;
    },
    enabled: !!profile?.id,
  });
};

export const usePlayerMatchCreation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  const createMatch = useMutation({
    mutationFn: async ({ 
      leagueId, 
      team1Id, 
      team2Id, 
      scheduledDate, 
      scheduledTime,
      createdByProfileId
    }: {
      leagueId: string;
      team1Id: string;
      team2Id: string;
      scheduledDate?: string;
      scheduledTime?: string;
      createdByProfileId: string;
    }) => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('Creating match with profile ID:', profile.id);

      // Verificar que puede crear un partido
      const { data: canCreate, error: checkError } = await supabase
        .rpc('can_create_match_this_week', { _profile_id: profile.id });

      console.log('Pre-creation check result:', canCreate, checkError);

      if (checkError) {
        console.error('Error checking match creation permission:', checkError);
        throw new Error('Error verificando permisos');
      }

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
          round: 1,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          created_by_profile_id: profile.id,
          status: 'pending',
          result_status: 'pending'
        })
        .select()
        .single();

      if (matchError) {
        console.error('Error creating match:', matchError);
        throw matchError;
      }

      console.log('Match created successfully:', match);

      // Registrar la creación del partido usando la función de base de datos
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Get Monday
      const weekStartString = currentWeekStart.toISOString().split('T')[0];
      
      const { error: recordError } = await supabase
        .rpc('record_match_creation', { 
          _profile_id: profile.id, 
          _week_start: weekStartString 
        });

      if (recordError) {
        console.error('Error recording match creation:', recordError);
        // No lanzar error aquí porque el partido ya se creó exitosamente
        // Solo logear el error para debug
      } else {
        console.log('Match creation recorded successfully for profile:', profile.id);
      }

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
      console.error('Match creation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { createMatch };
};
