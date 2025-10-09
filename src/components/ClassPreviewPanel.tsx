import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, Users, Target, MapPin, Euro, AlertTriangle, GraduationCap, Repeat, Sparkles, UserCheck, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface ClassPreviewPanelProps {
  formData: {
    name?: string;
    level_format?: "numeric" | "levante";
    level_from?: number;
    level_to?: number;
    custom_level?: string;
    start_time?: string;
    duration_minutes?: number;
    max_participants?: number;
    selected_days?: string[];
    start_date?: Date;
    end_date?: Date;
    recurrence_type?: string;
    court_number?: number;
    monthly_price?: number;
    objective?: string;
    selected_students?: string[];
    group_id?: string;
    selection_type?: "group" | "individual";
    club_id?: string;
  };
  previewDates: string[];
  conflicts: string[];
  students?: any[];
  groups?: any[];
  clubs?: any[];
  currentStep: number;
}

export default function ClassPreviewPanel({
  formData,
  previewDates,
  conflicts,
  students,
  groups,
  clubs,
  currentStep
}: ClassPreviewPanelProps) {
  const { t } = useTranslation();
  const [showAllDates, setShowAllDates] = useState(false);

  const getLevelDisplay = () => {
    if (formData.level_format === "numeric" && formData.level_from && formData.level_to) {
      return formData.level_from === formData.level_to
        ? `Nivel ${formData.level_from}`
        : `Niveles ${formData.level_from} - ${formData.level_to}`;
    } else if (formData.level_format === "levante" && formData.custom_level) {
      return formData.custom_level.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
    return "Sin especificar";
  };

  const getRecurrenceDisplay = () => {
    const types: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quincenal",
      monthly: "Mensual"
    };
    return types[formData.recurrence_type || "weekly"] || "Semanal";
  };

  const getDaysDisplay = () => {
    if (!formData.selected_days || formData.selected_days.length === 0) {
      return "Sin seleccionar";
    }
    return formData.selected_days
      .map(day => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(", ");
  };

  const getSelectedStudents = () => {
    if (formData.selection_type === "group" && formData.group_id && groups) {
      const selectedGroup = groups.find(g => g.id === formData.group_id);
      return selectedGroup?.members?.length || 0;
    }
    return formData.selected_students?.length || 0;
  };

  const getGroupName = () => {
    if (formData.selection_type === "group" && formData.group_id && groups) {
      const selectedGroup = groups.find(g => g.id === formData.group_id);
      return selectedGroup?.name || "Sin seleccionar";
    }
    return null;
  };

  const getClubName = () => {
    if (formData.club_id && clubs) {
      const selectedClub = clubs.find(c => c.id === formData.club_id);
      return selectedClub?.name || "Sin seleccionar";
    }
    return null;
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* Main Preview Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
              Vista Previa
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 space-y-2">
          {/* Class Name Section */}
          <div className="space-y-3">
            <div className={`text-2xl font-bold ${!formData.name ? 'text-slate-400 italic' : 'text-slate-800'}`}>
              {formData.name || "Sin nombre"}
            </div>
          </div>

          {/* Club Name */}
          {getClubName() && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Club</span>
              </div>
              <Badge variant="secondary" className="bg-white text-slate-700 border-slate-300 shadow-sm">
                {getClubName()}
              </Badge>
            </div>
          )}

          {/* Info Grid Modernizado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <GraduationCap className="h-4 w-4 text-primary" />
                Nivel
              </div>
              <div className="text-sm font-semibold text-slate-800">{getLevelDisplay()}</div>
            </div>

            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Clock className="h-4 w-4 text-primary" />
                Hora
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {formData.start_time || <span className="text-slate-400">-</span>}
              </div>
            </div>

            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Zap className="h-4 w-4 text-primary" />
                Duración
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {formData.duration_minutes ? `${formData.duration_minutes} min` : <span className="text-slate-400">-</span>}
              </div>
            </div>

            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Users className="h-4 w-4 text-primary" />
                Jugadores
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {formData.max_participants || <span className="text-slate-400">-</span>}
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar className="h-4 w-4 text-primary" />
              Programación
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Días</span>
                <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-300">
                  {getDaysDisplay()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Recurrencia</span>
                <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-300">
                  <Repeat className="h-3 w-3 mr-1" />
                  {getRecurrenceDisplay()}
                </Badge>
              </div>

              {formData.start_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Fecha inicio</span>
                  <span className="text-sm font-medium text-slate-800">
                    {format(formData.start_date, "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              )}

              {formData.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Fecha fin</span>
                  <span className="text-sm font-medium text-slate-800">
                    {format(formData.end_date, "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {currentStep >= 3 && (
            <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
              <div className="text-sm font-semibold text-slate-700 mb-2">Detalles adicionales</div>
              <div className="space-y-2">
                {formData.court_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Pista asignada
                    </span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Pista {formData.court_number}
                    </Badge>
                  </div>
                )}

                {formData.monthly_price !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <Euro className="h-4 w-4 text-primary" />
                      Precio mensual
                    </span>
                    <Badge variant={formData.monthly_price > 0 ? "default" : "secondary"} 
                      className={formData.monthly_price > 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-700"}>
                      {formData.monthly_price > 0 ? `€${formData.monthly_price}/mes` : "Gratuita"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates Preview - Integrated */}
          {previewDates.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-primary" />
                    Clases programadas
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    {previewDates.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {previewDates.slice(0, 5).map((date, index) => (
                    <div
                      key={index}
                      className="text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-200/60 hover:bg-slate-100 transition-colors font-medium text-slate-700"
                    >
                      {date}
                    </div>
                  ))}
                  {previewDates.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setShowAllDates(true)}
                    >
                      Ver todas las {previewDates.length} clases
                    </Button>
                  )}
                </div>
              </div>

              {/* Modal with all dates */}
              <Dialog open={showAllDates} onOpenChange={setShowAllDates}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Todas las clases programadas
                    </DialogTitle>
                    <DialogDescription>
                      Se crearán {previewDates.length} clases en total
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1 pr-2">
                    <div className="space-y-2">
                      {previewDates.map((date, index) => (
                        <div
                          key={index}
                          className="text-sm py-2 px-3 bg-slate-50 rounded-lg border border-slate-200/60 hover:bg-slate-100 transition-colors font-medium text-slate-700"
                        >
                          <span className="text-muted-foreground mr-2">#{index + 1}</span>
                          {date}
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      {/* Students Preview */}
      {currentStep >= 2 && getSelectedStudents() > 0 && (
        <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100/30 pb-4">
            <CardTitle className="text-base flex items-center justify-between text-slate-800">
              <span className="flex items-center gap-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                {formData.selection_type === "group" ? "Grupo asignado" : "Alumnos inscritos"}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                {getSelectedStudents()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formData.selection_type === "group" && getGroupName() ? (
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">{getGroupName()}</div>
                <div className="text-sm text-slate-600">
                  {getSelectedStudents()} {getSelectedStudents() === 1 ? "miembro" : "miembros"} en el grupo
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                {getSelectedStudents()} {getSelectedStudents() === 1 ? "alumno seleccionado" : "alumnos seleccionados"}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-2xl overflow-hidden border-l-4 border-l-orange-400">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-3 text-orange-700">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              Verificaciones necesarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-orange-700">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{conflict}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}