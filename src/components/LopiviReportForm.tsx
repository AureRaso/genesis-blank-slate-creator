import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface LopiviReportFormProps {
  clubId: string;
  clubName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
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

export const LopiviReportForm = ({ clubId, clubName, onSuccess, onCancel }: LopiviReportFormProps) => {
  const { toast } = useToast();
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

      toast({
        title: "Reporte enviado",
        description: "Tu reporte ha sido enviado correctamente. El delegado de protección del club será notificado.",
      });

      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting LOPIVI report:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl">Formulario de Reporte LOPIVI</CardTitle>
            <CardDescription className="mt-1">
              Club: {clubName}
            </CardDescription>
          </div>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-4 rounded-r-lg">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Información confidencial</p>
              <p>
                Este formulario permite reportar incidentes relacionados con la protección de menores.
                Toda la información será tratada de forma confidencial y será revisada por el Delegado
                de Protección del club.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del denunciante */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
              Información del denunciante
            </h3>

            <div className="space-y-2">
              <Label htmlFor="reporter_name">Tu nombre completo *</Label>
              <Input
                id="reporter_name"
                {...register("reporter_name", { required: "El nombre es obligatorio" })}
                placeholder="Nombre y apellidos"
              />
              {errors.reporter_name && (
                <p className="text-sm text-destructive">{errors.reporter_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporter_email">Tu email *</Label>
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
              />
              {errors.reporter_email && (
                <p className="text-sm text-destructive">{errors.reporter_email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporter_phone">Tu teléfono</Label>
              <Input
                id="reporter_phone"
                {...register("reporter_phone")}
                placeholder="+34 666 123 456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporter_relationship">Tu relación con el incidente *</Label>
              <Select
                onValueChange={(value) => setValue("reporter_relationship", value)}
                value={watch("reporter_relationship")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu relación" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watch("reporter_relationship") && (
                <p className="text-sm text-destructive">La relación es obligatoria</p>
              )}
            </div>
          </div>

          {/* Información del incidente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
              Información del incidente
            </h3>

            <div className="space-y-2">
              <Label htmlFor="incident_type">Tipo de incidente *</Label>
              <Select
                onValueChange={(value) => setValue("incident_type", value)}
                value={watch("incident_type")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de incidente" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watch("incident_type") && (
                <p className="text-sm text-destructive">El tipo de incidente es obligatorio</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident_date">Fecha del incidente</Label>
              <Input
                id="incident_date"
                type="date"
                {...register("incident_date")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident_description">Descripción del incidente *</Label>
              <Textarea
                id="incident_description"
                {...register("incident_description", {
                  required: "La descripción es obligatoria",
                  minLength: { value: 20, message: "La descripción debe tener al menos 20 caracteres" }
                })}
                placeholder="Describe detalladamente qué ocurrió, cuándo, dónde y cómo..."
                rows={6}
              />
              {errors.incident_description && (
                <p className="text-sm text-destructive">{errors.incident_description.message}</p>
              )}
              <p className="text-xs text-slate-500">
                {watch("incident_description")?.length || 0} caracteres (mínimo 20)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="people_involved">Personas involucradas</Label>
              <Textarea
                id="people_involved"
                {...register("people_involved")}
                placeholder="Nombres de las personas involucradas en el incidente (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnesses">Testigos</Label>
              <Textarea
                id="witnesses"
                {...register("witnesses")}
                placeholder="Nombres de personas que presenciaron el incidente (opcional)"
                rows={3}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
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
      </CardContent>
    </Card>
  );
};
