import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HoldedInvoice {
  id: string;
  club_id: string;
  stripe_invoice_id: string;
  holded_invoice_id: string | null;
  holded_invoice_num: string | null;
  amount: number;
  currency: string;
  status: string; // 'pending' | 'synced' | 'error'
  error_message: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined from clubs
  club_name?: string;
}

export const useHoldedInvoices = (clubId?: string) => {
  return useQuery({
    queryKey: ['holded-invoices', clubId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('holded_invoices')
        .select('*, clubs(name)')
        .order('created_at', { ascending: false });

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching holded invoices:', error);
        throw error;
      }

      return (data || []).map((inv: any) => ({
        ...inv,
        club_name: inv.clubs?.name || 'Desconocido',
      })) as HoldedInvoice[];
    },
  });
};

export const useReprocessHoldedInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (stripeInvoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('holded-create-invoice', {
        body: { stripeInvoiceId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['holded-invoices'] });
      if (data?.skipped) {
        toast({ title: "Info", description: "Esta factura ya estaba sincronizada" });
      } else if (data?.pending) {
        toast({ title: "Pendiente", description: "El club aún no tiene contacto en Holded", variant: "destructive" });
      } else {
        toast({ title: "Sincronizada", description: `Factura ${data?.holdedInvoiceNum || ''} creada en Holded` });
      }
    },
    onError: (error) => {
      console.error('Error reprocessing invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al reprocesar factura",
        variant: "destructive",
      });
    },
  });
};

export const useReprocessAllPending = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clubId?: string) => {
      // Fetch pending invoices
      let query = (supabase as any)
        .from('holded_invoices')
        .select('stripe_invoice_id')
        .in('status', ['pending', 'error']);

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data: pendingInvoices, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      if (!pendingInvoices || pendingInvoices.length === 0) {
        return { processed: 0, success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      for (const inv of pendingInvoices) {
        try {
          const { data, error } = await supabase.functions.invoke('holded-create-invoice', {
            body: { stripeInvoiceId: inv.stripe_invoice_id },
          });
          if (error || data?.error) {
            failed++;
          } else {
            success++;
          }
        } catch {
          failed++;
        }
      }

      return { processed: pendingInvoices.length, success, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['holded-invoices'] });
      if (result.processed === 0) {
        toast({ title: "Info", description: "No hay facturas pendientes por reprocesar" });
      } else {
        toast({
          title: "Reprocesamiento completado",
          description: `${result.success} sincronizadas, ${result.failed} con errores de ${result.processed} total`,
        });
      }
    },
    onError: (error) => {
      console.error('Error reprocessing all:', error);
      toast({
        title: "Error",
        description: "Error al reprocesar facturas pendientes",
        variant: "destructive",
      });
    },
  });
};