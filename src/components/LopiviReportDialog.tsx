import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LopiviReportFormData {
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string;
  reporter_relationship: string;
  incident_type: string;
  incident_date: string;
  incident_description: string;
  people_involved: string;
  witnesses: string;
}

interface LopiviReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  clubName: string;
}

const INCIDENT_TYPES = [
  "Violencia física",
  "Violencia psicológica",
  "Acoso o bullying",
  "Discriminación",
  "Conducta inapropiada",
  "Negligencia",
  "Otro"
];

const RELATIONSHIP_TYPES = [
  "Padre/Madre",
  "Tutor legal",
  "Alumno/a",
  "Testigo",
  "Otro"
];

export const LopiviReportDialog = ({ open, onOpenChange, clubId, clubName }: LopiviReportDialogProps) => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LopiviReportFormData>({
    defaultValues: {
      reporter_name: profile?.full_name || "",
      reporter_email: "",
      reporter_phone: profile?.phone || "",
      reporter_relationship: "",
      incident_type: "",
      incident_date: "",
      incident_description: "",
      people_involved: "",
      witnesses: "",
    },
  });

  const onSubmit = async (data: LopiviReportFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('lopivi_reports')
        .insert({
          club_id: clubId,
          reporter_profile_id: profile?.id || null,
          reporter_name: data.reporter_name,
          reporter_email: data.reporter_email,
          reporter_phone: data.reporter_phone || null,
          reporter_relationship: data.reporter_relationship,
          incident_type: data.incident_type,
          incident_date: data.incident_date || null,
          incident_description: data.incident_description,
          people_involved: data.people_involved || null,
          witnesses: data.witnesses || null,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast.success('Reporte enviado', {
        description: 'Tu reporte ha sido enviado correctamente. El delegado de protección del club será notificado.',
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting LOPIVI report:', error);
      toast.error('Error', {
        description: 'No se pudo enviar el reporte. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" />
            Reporte de Incidente LOPIVI
          </DialogTitle>
          <DialogDescription>
            Club: {clubName} · Toda la información será tratada de forma confidencial
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Alert Box */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Este formulario permite reportar incidentes relacionados con la protección de menores.
                </p>
              </div>
            </div>

            {/* Compact Form Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="reporter_name" className="text-sm">Nombre completo *</Label>
                <Input
                  id="reporter_name"
                  {...register("reporter_name", { required: "El nombre es obligatorio" })}
                  placeholder="Nombre y apellidos"
                  className="h-9"
                />
                {errors.reporter_name && (
                  <p className="text-xs text-destructive mt-1">{errors.reporter_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reporter_email" className="text-sm">Email *</Label>
                <Input
                  id="reporter_email"
                  type="email"
                  {...register("reporter_email", {
                    required: "El email es obligatorio",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido"
                    }
                  })}
                  placeholder="tu@email.com"
                  className="h-9"
                />
                {errors.reporter_email && (
                  <p className="text-xs text-destructive mt-1">{errors.reporter_email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reporter_phone" className="text-sm">Teléfono</Label>
                <Input
                  id="reporter_phone"
                  {...register("reporter_phone")}
                  placeholder="+34 666 123 456"
                  className="h-9"
                />
              </div>

              <div>
                <Label htmlFor="reporter_relationship" className="text-sm">Tu relación *</Label>
                <Select
                  onValueChange={(value) => setValue("reporter_relationship", value)}
                  value={watch("reporter_relationship")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!watch("reporter_relationship") && (
                  <p className="text-xs text-destructive mt-1">Requerido</p>
                )}
              </div>

              <div>
                <Label htmlFor="incident_type" className="text-sm">Tipo de incidente *</Label>
                <Select
                  onValueChange={(value) => setValue("incident_type", value)}
                  value={watch("incident_type")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!watch("incident_type") && (
                  <p className="text-xs text-destructive mt-1">Requerido</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="incident_date" className="text-sm">Fecha del incidente</Label>
                <Input
                  id="incident_date"
                  type="date"
                  {...register("incident_date")}
                  className="h-9"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="incident_description" className="text-sm">Descripción del incidente * (mín. 20 caracteres)</Label>
                <Textarea
                  id="incident_description"
                  {...register("incident_description", {
                    required: "La descripción es obligatoria",
                    minLength: { value: 20, message: "Mínimo 20 caracteres" }
                  })}
                  placeholder="Describe qué ocurrió, cuándo, dónde..."
                  rows={4}
                  className="resize-none"
                />
                {errors.incident_description && (
                  <p className="text-xs text-destructive mt-1">{errors.incident_description.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {watch("incident_description")?.length || 0}/20
                </p>
              </div>

              <div className="col-span-2">
                <Label htmlFor="people_involved" className="text-sm">Personas involucradas</Label>
                <Textarea
                  id="people_involved"
                  {...register("people_involved")}
                  placeholder="Nombres (opcional)"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="witnesses" className="text-sm">Testigos</Label>
                <Textarea
                  id="witnesses"
                  {...register("witnesses")}
                  placeholder="Nombres de testigos (opcional)"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !watch("reporter_relationship") || !watch("incident_type")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Reporte
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
