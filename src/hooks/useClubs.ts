import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Club = {
  id: string;
  name: string;
  address: string;
  phone: string;
  court_count: number;
  court_types: string[];
  description?: string;
  status?: string;
  created_by_profile_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateClubData = {
  name: string;
  address: string;
  phone: string;
  court_count: number;
  court_types: string[];
  description?: string;
};

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      console.log('Fetching clubs...');
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clubs:', error);
        throw error;
      }
      
      console.log('Clubs fetched:', data);
      return data as Club[];
    },
  });
};

export const useAdminClubs = () => {
  return useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      console.log('Fetching admin clubs...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('created_by_profile_id', userData.user.id)
        .order('name');

      if (error) {
        console.error('Error fetching admin clubs:', error);
        throw error;
      }
      
      console.log('Admin clubs fetched:', data);
      return data as Club[];
    },
  });
};

export const usePlayerClubs = (clubId?: string) => {
  return useQuery({
    queryKey: ['player-clubs', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      
      console.log('Fetching player club:', clubId);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .order('name');

      if (error) {
        console.error('Error fetching player club:', error);
        throw error;
      }
      
      console.log('Player club fetched:', data);
      return data as Club[];
    },
    enabled: !!clubId,
  });
};

export const useActiveClubs = () => {
  return useQuery({
    queryKey: ['active-clubs'],
    queryFn: async () => {
      console.log('Fetching active clubs...');
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching active clubs:', error);
        throw error;
      }
      
      console.log('Active clubs fetched:', data);
      return data as Club[];
    },
  });
};

export const useCreateClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clubData: CreateClubData) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          ...clubData,
          created_by_profile_id: userData.user.id,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['active-clubs'] });
      toast({
        title: "Éxito",
        description: "Club creado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating club:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el club",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Club> & { id: string }) => {
      const { data, error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['active-clubs'] });
      toast({
        title: "Éxito",
        description: "Club actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating club:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el club",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['active-clubs'] });
      toast({
        title: "Éxito",
        description: "Club eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting club:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el club",
        variant: "destructive",
      });
    },
  });
};

export const useClubLeagues = (clubId: string) => {
  return useQuery({
    queryKey: ['club-leagues', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('club_id', clubId);

      if (error) throw error;
      return data;
    },
  });
};
