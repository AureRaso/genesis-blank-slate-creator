import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WhatsAppReportConfig {
  id: string;
  club_id: string;
  group_name: string;
  whatsapp_group_id: string;
  is_active: boolean;
  send_morning_report: boolean;
  send_afternoon_report: boolean;
  morning_report_time: string;
  afternoon_report_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWhatsAppReportConfigInput {
  club_id: string;
  group_name: string;
  whatsapp_group_id: string;
  is_active?: boolean;
  send_morning_report?: boolean;
  send_afternoon_report?: boolean;
  morning_report_time?: string;
  afternoon_report_time?: string;
}

export interface UpdateWhatsAppReportConfigInput {
  id: string;
  group_name?: string;
  whatsapp_group_id?: string;
  is_active?: boolean;
  send_morning_report?: boolean;
  send_afternoon_report?: boolean;
  morning_report_time?: string;
  afternoon_report_time?: string;
}

// Get WhatsApp report configuration for a club
export function useWhatsAppReportConfig(clubId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-report-config", clubId],
    queryFn: async () => {
      if (!clubId) return null;

      const { data, error } = await supabase
        .from("whatsapp_report_groups")
        .select("*")
        .eq("club_id", clubId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - this is expected if config doesn't exist yet
          return null;
        }
        throw error;
      }

      return data as WhatsAppReportConfig;
    },
    enabled: !!clubId,
  });

  const createConfig = useMutation({
    mutationFn: async (input: CreateWhatsAppReportConfigInput) => {
      const { data, error } = await supabase
        .from("whatsapp_report_groups")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-report-config", clubId] });
      toast({
        title: "Configuración creada",
        description: "La configuración de reportes se ha creado correctamente",
      });
    },
    onError: (error: any) => {
      console.error("Error creating config:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la configuración",
        variant: "destructive",
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (input: UpdateWhatsAppReportConfigInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("whatsapp_report_groups")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-report-config", clubId] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error: any) => {
      console.error("Error updating config:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_report_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-report-config", clubId] });
      toast({
        title: "Configuración eliminada",
        description: "La configuración de reportes se ha eliminado",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting config:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la configuración",
        variant: "destructive",
      });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}

// Trigger manual report generation
export function useTriggerDailyReport() {
  return useMutation({
    mutationFn: async ({
      clubId,
      reportType,
    }: {
      clubId: string;
      reportType: "morning" | "afternoon";
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-daily-report", {
        body: {
          clubId,
          reportType,
          manual: true,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Reporte enviado",
        description: "El reporte se ha enviado al grupo de WhatsApp",
      });
    },
    onError: (error: any) => {
      console.error("Error triggering report:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el reporte",
        variant: "destructive",
      });
    },
  });
}
