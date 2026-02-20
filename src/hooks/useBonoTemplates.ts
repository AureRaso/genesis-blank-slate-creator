import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import i18n from "@/i18n";

// Types
export type BonoUsageType = 'fixed' | 'waitlist' | 'both';

export interface BonoTemplate {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  total_classes: number;
  price: number;
  validity_days: number | null;
  usage_type: BonoUsageType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBonoTemplateInput {
  name: string;
  description?: string;
  total_classes: number;
  price: number;
  validity_days?: number | null;
  usage_type?: BonoUsageType;
}

export interface UpdateBonoTemplateInput extends Partial<CreateBonoTemplateInput> {
  id: string;
  is_active?: boolean;
}

// Hook to fetch bono templates for a club
export function useBonoTemplates(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['bono-templates', targetClubId],
    queryFn: async () => {
      if (!targetClubId) return [];

      const { data, error } = await supabase
        .from('bono_templates')
        .select('*')
        .eq('club_id', targetClubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BonoTemplate[];
    },
    enabled: !!targetClubId,
  });
}

// Hook to fetch only active bono templates
export function useActiveBonoTemplates(clubId?: string) {
  const { effectiveClubId } = useAuth();
  const targetClubId = clubId || effectiveClubId;

  return useQuery({
    queryKey: ['bono-templates', targetClubId, 'active'],
    queryFn: async () => {
      if (!targetClubId) return [];

      const { data, error } = await supabase
        .from('bono_templates')
        .select('*')
        .eq('club_id', targetClubId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as BonoTemplate[];
    },
    enabled: !!targetClubId,
  });
}

// Hook to create a bono template
export function useCreateBonoTemplate() {
  const queryClient = useQueryClient();
  const { effectiveClubId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBonoTemplateInput) => {
      if (!effectiveClubId) throw new Error('No club selected');

      const { data, error } = await supabase
        .from('bono_templates')
        .insert({
          club_id: effectiveClubId,
          name: input.name,
          description: input.description || null,
          total_classes: input.total_classes,
          price: input.price,
          validity_days: input.validity_days || null,
          usage_type: input.usage_type || 'both',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bono-templates'] });
      toast.success(i18n.t('bonoTemplates.toasts.created'));
    },
    onError: (error: Error) => {
      console.error('Error creating bono template:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorCreating'));
    },
  });
}

// Hook to update a bono template
export function useUpdateBonoTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBonoTemplateInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('bono_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bono-templates'] });
      toast.success(i18n.t('bonoTemplates.toasts.updated'));
    },
    onError: (error: Error) => {
      console.error('Error updating bono template:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorUpdating'));
    },
  });
}

// Hook to delete a bono template
export function useDeleteBonoTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bono_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bono-templates'] });
      toast.success(i18n.t('bonoTemplates.toasts.deleted'));
    },
    onError: (error: Error) => {
      console.error('Error deleting bono template:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorDeleting'));
    },
  });
}

// Hook to toggle bono template active status
export function useToggleBonoTemplateActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('bono_templates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bono-templates'] });
      toast.success(data.is_active ? i18n.t('bonoTemplates.toasts.activated') : i18n.t('bonoTemplates.toasts.deactivated'));
    },
    onError: (error: Error) => {
      console.error('Error toggling bono template:', error);
      toast.error(i18n.t('bonoTemplates.toasts.errorToggling'));
    },
  });
}