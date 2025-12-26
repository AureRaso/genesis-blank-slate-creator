import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/types/padel';
import { useToast } from '@/hooks/use-toast';

export const useMatches = (leagueId?: string, clubId?: string) => {
  return useQuery({
    queryKey: ['matches', leagueId, clubId],
    queryFn: async () => {
      console.log('Fetching matches for league:', leagueId, 'clubId:', clubId);

      // Get user profile to check role for filtering
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      // If no leagueId provided, get leagues filtered by club first
      let leagueIds: string[] = [];

      if (leagueId) {
        leagueIds = [leagueId];
      } else {
        // Need to filter matches by clubs
        let clubIds: string[] = [];

        if (clubId) {
          clubIds = [clubId];
        } else if (userProfile.role === 'superadmin') {
          // Superadmin with no specific club - get ALL their assigned clubs
          const { data: superadminClubs, error: superadminClubsError } = await supabase
            .from('admin_clubs')
            .select('club_id')
            .eq('admin_profile_id', userData.user.id);

          if (superadminClubsError) throw superadminClubsError;

          if (!superadminClubs || superadminClubs.length === 0) {
            return [];
          }

          clubIds = superadminClubs.map(ac => ac.club_id);
        } else if (userProfile.role === 'admin') {
          // Regular admin - get clubs created by this admin
          const { data: adminClubs, error: clubsError } = await supabase
            .from('clubs')
            .select('id')
            .eq('created_by_profile_id', userData.user.id);

          if (clubsError) throw clubsError;

          if (!adminClubs || adminClubs.length === 0) {
            return [];
          }

          clubIds = adminClubs.map(club => club.id);
        }

        // Get leagues from these clubs
        if (clubIds.length > 0) {
          const { data: clubLeagues, error: leaguesError } = await supabase
            .from('leagues')
            .select('id')
            .in('club_id', clubIds);

          if (leaguesError) throw leaguesError;

          if (!clubLeagues || clubLeagues.length === 0) {
            return [];
          }

          leagueIds = clubLeagues.map(l => l.id);
        }
      }

      // Primero obtener los matches básicos
      let matchQuery = supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true })
        .order('created_at', { ascending: true });

      if (leagueIds.length > 0) {
        matchQuery = matchQuery.in('league_id', leagueIds);
      }

      const { data: matches, error: matchError } = await matchQuery;

      if (matchError) {
        console.error('Error fetching matches:', matchError);
        throw matchError;
      }

      if (!matches || matches.length === 0) {
        console.log('No matches found');
        return [];
      }

      // Obtener todos los team IDs únicos
      const teamIds = new Set<string>();
      matches.forEach(match => {
        teamIds.add(match.team1_id);
        teamIds.add(match.team2_id);
      });

      // Obtener información de los teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, player1_id, player2_id')
        .in('id', Array.from(teamIds));

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      // Obtener todos los profile IDs únicos
      const profileIds = new Set<string>();
      teams?.forEach(team => {
        if (team.player1_id) profileIds.add(team.player1_id);
        if (team.player2_id) profileIds.add(team.player2_id);
      });

      // Obtener información de los profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', Array.from(profileIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Obtener las ligas
      const matchLeagueIds = [...new Set(matches.map(match => match.league_id))];
      const { data: leagues, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name')
        .in('id', matchLeagueIds);

      if (leaguesError) {
        console.error('Error fetching leagues:', leaguesError);
        throw leaguesError;
      }

      // Obtener los resultados de los matches
      const matchIds = matches.map(match => match.id);
      const { data: matchResults, error: resultsError } = await supabase
        .from('match_results')
        .select('*')
        .in('match_id', matchIds);

      if (resultsError) {
        console.error('Error fetching match results:', resultsError);
        throw resultsError;
      }

      // Crear mapas para lookup rápido
      const teamsMap = new Map();
      const profilesMap = new Map();
      const leaguesMap = new Map();
      const resultsMap = new Map();

      teams?.forEach(team => teamsMap.set(team.id, team));
      profiles?.forEach(profile => profilesMap.set(profile.id, profile));
      leagues?.forEach(league => leaguesMap.set(league.id, league));
      matchResults?.forEach(result => {
        if (!resultsMap.has(result.match_id)) {
          resultsMap.set(result.match_id, []);
        }
        resultsMap.get(result.match_id).push(result);
      });

      // Combinar toda la información
      const enrichedMatches = matches.map(match => {
        const team1 = teamsMap.get(match.team1_id);
        const team2 = teamsMap.get(match.team2_id);
        const league = leaguesMap.get(match.league_id);
        const results = resultsMap.get(match.id) || [];

        return {
          ...match,
          team1: team1 ? {
            ...team1,
            player1: profilesMap.get(team1.player1_id) || null,
            player2: profilesMap.get(team1.player2_id) || null,
          } : null,
          team2: team2 ? {
            ...team2,
            player1: profilesMap.get(team2.player1_id) || null,
            player2: profilesMap.get(team2.player2_id) || null,
          } : null,
          league: league || null,
          match_results: results
        };
      });

      console.log('Matches fetched and enriched:', enrichedMatches);
      return enrichedMatches;
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
