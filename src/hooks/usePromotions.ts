import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Promotion, CreatePromotionData, UpdatePromotionData } from "@/types/promotions";

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      console.log('Fetching promotions...');
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          clubs(name, status)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        throw error;
      }

      console.log('Promotions fetched:', data);
      return data as Promotion[];
    },
  });
};

export const usePromotionsByClub = (clubId?: string) => {
  return useQuery({
    queryKey: ['promotions-by-club', clubId],
    queryFn: async () => {
      if (!clubId) return [];

      console.log('Fetching promotions for club:', clubId);
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          clubs(name, status)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions by club:', error);
        throw error;
      }

      console.log('Promotions by club fetched:', data);
      return data as Promotion[];
    },
    enabled: !!clubId,
  });
};

// Hook to check if club has promotions (for conditional rendering)
export const useHasPromotions = (clubId?: string) => {
  return useQuery({
    queryKey: ['has-promotions', clubId],
    queryFn: async () => {
      if (!clubId) return false;

      const { data, error } = await supabase
        .from('promotions')
        .select('id')
        .eq('club_id', clubId)
        .limit(1);

      if (error) {
        console.error('Error checking promotions:', error);
        return false;
      }

      return (data && data.length > 0) || false;
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promotionData: CreatePromotionData) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          ...promotionData,
          created_by: userData.user.id
        }])
        .select(`
          *,
          clubs(name, status)
        `)
        .single();

      if (error) throw error;
      return data as Promotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions-by-club'] });
      toast({
        title: "Éxito",
        description: "Promoción creada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la promoción",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePromotionData & { id: string }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          clubs(name, status)
        `)
        .single();

      if (error) throw error;
      return data as Promotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions-by-club'] });
      toast({
        title: "Éxito",
        description: "Promoción actualizada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating promotion:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la promoción",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions-by-club'] });
      toast({
        title: "Éxito",
        description: "Promoción eliminada correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la promoción",
        variant: "destructive",
      });
    },
  });
};
