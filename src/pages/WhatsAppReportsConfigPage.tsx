import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OwnerLayout } from "@/components/OwnerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clock, Save, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useWhatsAppReportConfig, useTriggerDailyReport } from "@/hooks/useWhatsAppReports";
import { toast } from "@/hooks/use-toast";

export default function WhatsAppReportsConfigPage() {
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  // Get all clubs available (owners can see all clubs via RLS)
  const { data: userClubs, isLoading: loadingClubs, error: clubsError } = useQuery({
    queryKey: ["owner-available-clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("❌ Error fetching clubs:", error);
        throw error;
      }

      return data || [];
    },
  });

  // Set first club as selected by default
  useEffect(() => {
    if (userClubs && userClubs.length > 0 && !selectedClubId) {
      setSelectedClubId(userClubs[0].id);
    }
  }, [userClubs, selectedClubId]);

  const {
    data: config,
    isLoading: loadingConfig,
    updateConfig,
    createConfig,
  } = useWhatsAppReportConfig(selectedClubId);

  const triggerReport = useTriggerDailyReport();

  const [formData, setFormData] = useState({
    group_name: "",
    whatsapp_group_id: "",
    is_active: true,
    send_morning_report: true,
    send_afternoon_report: true,
    morning_report_time: "10:00:00",
    afternoon_report_time: "13:00:00",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        group_name: config.group_name,
        whatsapp_group_id: config.whatsapp_group_id,
        is_active: config.is_active,
        send_morning_report: config.send_morning_report,
        send_afternoon_report: config.send_afternoon_report,
        morning_report_time: config.morning_report_time,
        afternoon_report_time: config.afternoon_report_time,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!selectedClubId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un club",
        variant: "destructive",
      });
      return;
    }

    if (!formData.group_name || !formData.whatsapp_group_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (config) {
        await updateConfig.mutateAsync({
          id: config.id,
          ...formData,
        });
      } else {
        await createConfig.mutateAsync({
          club_id: selectedClubId,
          ...formData,
        });
      }

      toast({
        title: "Configuración guardada",
        description: "Los reportes diarios se enviarán al grupo configurado",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleTestReport = async (reportType: "morning" | "afternoon") => {
    if (!selectedClubId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un club primero",
        variant: "destructive",
      });
      return;
    }

    if (!config) {
      toast({
        title: "Error",
        description: "Guarda la configuración antes de probar el reporte",
        variant: "destructive",
      });
      return;
    }

    try {
      await triggerReport.mutateAsync({
        clubId: selectedClubId,
        reportType,
      });
    } catch (error) {
      console.error("Error triggering report:", error);
    }
  };

  if (loadingClubs || loadingConfig) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </OwnerLayout>
    );
  }

  if (!userClubs || userClubs.length === 0) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-64">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sin Clubes Disponibles</CardTitle>
              <CardDescription>
                {clubsError ? (
                  <>
                    <p className="text-destructive mb-2">Error al cargar clubes: {clubsError.message}</p>
                    <p className="text-sm">Verifica que tienes permisos para acceder a los clubes o contacta con soporte.</p>
                  </>
                ) : (
                  "No tienes clubes configurados. Crea un club primero para poder configurar reportes de WhatsApp."
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reportes Diarios WhatsApp</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configura el grupo que recibirá los reportes automáticos
            </p>
          </div>
        </div>

        {/* Club Selector */}
        {userClubs.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecciona un Club</CardTitle>
              <CardDescription>
                Elige el club para el que quieres configurar los reportes de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent>
                  {userClubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-blue-900 font-medium">
                  ¿Cómo obtener el ID del grupo de WhatsApp?
                </p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abre WhatsApp Web y entra al grupo</li>
                  <li>Mira la URL del navegador</li>
                  <li>Copia el ID que aparece después de "chat/" (ejemplo: 34666777888-1234567890@g.us)</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              Configuración del Grupo
              {userClubs.length === 1 && (
                <Badge variant="outline" className="ml-2">
                  {userClubs[0].name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Define el grupo de WhatsApp y horarios de envío para reportes diarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Reportes Activos</Label>
                <p className="text-sm text-muted-foreground">
                  Activa o desactiva el envío automático de reportes
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>

            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group_name">Nombre del Grupo *</Label>
              <Input
                id="group_name"
                placeholder="Ej: Entrenadores Club Padel"
                value={formData.group_name}
                onChange={(e) =>
                  setFormData({ ...formData, group_name: e.target.value })
                }
              />
            </div>

            {/* WhatsApp Group ID */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp_group_id">ID del Grupo de WhatsApp *</Label>
              <Input
                id="whatsapp_group_id"
                placeholder="34666777888-1234567890@g.us"
                value={formData.whatsapp_group_id}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp_group_id: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Incluye el @g.us al final del ID
              </p>
            </div>

            {/* Report Times */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horarios de Envío
              </h3>

              {/* Morning Report */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm">Reporte Matutino</Label>
                  <Input
                    type="time"
                    className="max-w-[150px]"
                    value={formData.morning_report_time.substring(0, 5)}
                    onChange={(e) =>
                      setFormData({ ...formData, morning_report_time: e.target.value + ":00" })
                    }
                    disabled={!formData.send_morning_report}
                  />
                </div>
                <Switch
                  checked={formData.send_morning_report}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, send_morning_report: checked })
                  }
                />
              </div>

              {/* Afternoon Report */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm">Reporte Vespertino</Label>
                  <Input
                    type="time"
                    className="max-w-[150px]"
                    value={formData.afternoon_report_time.substring(0, 5)}
                    onChange={(e) =>
                      setFormData({ ...formData, afternoon_report_time: e.target.value + ":00" })
                    }
                    disabled={!formData.send_afternoon_report}
                  />
                </div>
                <Switch
                  checked={formData.send_afternoon_report}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, send_afternoon_report: checked })
                  }
                />
              </div>
            </div>

            {/* Status Badge */}
            {config && (
              <div className="flex items-center gap-2 pt-4 border-t">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">
                  Última actualización: {new Date(config.updated_at).toLocaleString('es-ES')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {config && (
            <>
              <Button
                variant="outline"
                onClick={() => handleTestReport("morning")}
                disabled={triggerReport.isPending}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Probar Reporte Matutino
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestReport("afternoon")}
                disabled={triggerReport.isPending}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Probar Reporte Vespertino
              </Button>
            </>
          )}
          <Button
            onClick={handleSave}
            disabled={updateConfig.isPending || createConfig.isPending}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateConfig.isPending || createConfig.isPending
              ? "Guardando..."
              : "Guardar Configuración"}
          </Button>
        </div>

        {/* Example Report */}
        <Card>
          <CardHeader>
            <CardTitle>Ejemplo de Reporte</CardTitle>
            <CardDescription>
              Así se verá el reporte que recibirás en WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap border">
              {`☀️ *¡Buenos días, Entrenador!*
🎾 *RESUMEN DE LAS 10*
📅 Lunes, 6 de Enero 2025

✅ Tasa de respuesta: 85%

━━━━━━━━━━━━━━━━━━
🔴 *CLASES CON HUECOS*
━━━━━━━━━━━━━━━━━━

🎯 *Clase Intermedio - 10:30*
👤 Entrenador: María García
📊 Ocupación: 6/8 (2 huecos)

🚫 Rechazos:
   • Juan Pérez - Lesión
   • Ana López - Trabajo

⏰ *Clase Avanzado - 12:00*
👤 Entrenador: Carlos Ruiz
📊 Ocupación: 5/8 (3 huecos)

━━━━━━━━━━━━━━━━━━
⏳ *LISTA DE ESPERA*
━━━━━━━━━━━━━━━━━━

🔹 Pedro Martín
   Clase: Principiante - 09:00
   Esperando: 2 días 5 horas

━━━━━━━━━━━━━━━━━━
💡 *ACCIONES SUGERIDAS*
━━━━━━━━━━━━━━━━━━

• Contactar a Pedro Martín (lleva 2 días en espera)
• Revisar Clase Avanzado 12:00 (3 huecos disponibles)`}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
