import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export interface PaymentRate {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  rate_type: 'fija' | 'por_clase';
  periodicity: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  fixed_price: number | null;
  price_per_class: number | null;
  billing_day: number;
  due_days: number;
  grace_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRateInput {
  name: string;
  description?: string;
  rate_type: 'fija' | 'por_clase';
  periodicity: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  fixed_price?: number;
  price_per_class?: number;
  billing_day: number;
  due_days?: number;
  grace_days?: number;
}

export interface UpdatePaymentRateInput extends Partial<CreatePaymentRateInput> {
  id: string;
  is_active?: boolean;
}

// Hook to fetch payment rates for a club
export function usePaymentRates(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['payment-rates', targetClubId],
    queryFn: async () => {
      if (!targetClubId) return [];

      const { data, error } = await supabase
        .from('payment_rates')
        .select('*')
        .eq('club_id', targetClubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentRate[];
    },
    enabled: !!targetClubId,
  });
}

// Hook to fetch only active payment rates
export function useActivePaymentRates(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['payment-rates', targetClubId, 'active'],
    queryFn: async () => {
      if (!targetClubId) return [];

      const { data, error } = await supabase
        .from('payment_rates')
        .select('*')
        .eq('club_id', targetClubId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as PaymentRate[];
    },
    enabled: !!targetClubId,
  });
}

// Hook to create a payment rate
export function useCreatePaymentRate() {
  const queryClient = useQueryClient();
  const { effectiveClubId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePaymentRateInput) => {
      if (!effectiveClubId) throw new Error('No club selected');

      const { data, error } = await supabase
        .from('payment_rates')
        .insert({
          club_id: effectiveClubId,
          name: input.name,
          description: input.description || null,
          rate_type: input.rate_type,
          periodicity: input.periodicity,
          fixed_price: input.rate_type === 'fija' ? input.fixed_price : null,
          price_per_class: input.rate_type === 'por_clase' ? input.price_per_class : null,
          billing_day: input.billing_day,
          due_days: input.due_days || 30,
          grace_days: input.grace_days || 7,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-rates'] });
      toast.success('Tarifa creada correctamente');
    },
    onError: (error: Error) => {
      console.error('Error creating payment rate:', error);
      toast.error('Error al crear la tarifa');
    },
  });
}

// Hook to update a payment rate
export function useUpdatePaymentRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePaymentRateInput) => {
      const { id, ...updates } = input;

      // Clean up pricing based on rate_type
      const cleanUpdates: Record<string, unknown> = { ...updates };
      if (updates.rate_type === 'fija') {
        cleanUpdates.price_per_class = null;
      } else if (updates.rate_type === 'por_clase') {
        cleanUpdates.fixed_price = null;
      }

      const { data, error } = await supabase
        .from('payment_rates')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-rates'] });
      toast.success('Tarifa actualizada correctamente');
    },
    onError: (error: Error) => {
      console.error('Error updating payment rate:', error);
      toast.error('Error al actualizar la tarifa');
    },
  });
}

// Hook to delete a payment rate
export function useDeletePaymentRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-rates'] });
      toast.success('Tarifa eliminada correctamente');
    },
    onError: (error: Error) => {
      console.error('Error deleting payment rate:', error);
      toast.error('Error al eliminar la tarifa. Puede que tenga asignaciones activas.');
    },
  });
}

// Hook to toggle payment rate active status
export function useTogglePaymentRateActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('payment_rates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-rates'] });
      toast.success(data.is_active ? 'Tarifa activada' : 'Tarifa desactivada');
    },
    onError: (error: Error) => {
      console.error('Error toggling payment rate:', error);
      toast.error('Error al cambiar el estado de la tarifa');
    },
  });
}
