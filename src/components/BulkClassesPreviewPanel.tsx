import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock, DollarSign, CalendarDays, Zap, TrendingUp } from "lucide-react";

interface BulkClassesPreviewPanelProps {
  clubName?: string;
  selectedCourtNumbers: number[];
  selectedTrainerNames: string[];
  baseConfig: {
    name: string;
    duration_minutes: number;
    monthly_price: number;
    level_from: number;
    level_to: number;
    first_class_time: string;
  };
  multiplicationConfig: {
    days_of_week: string[];
    time_slots: Array<{ start: string; end: string; interval: number }>;
  };
  generatedClassesCount: number;
  generatedClassesPreview: Array<{
    day_of_week: string;
    start_time: string;
    court_number: number;
    trainer_name: string;
  }>;
  step: 1 | 2 | 3;
}

const DAY_LABELS: Record<string, string> = {
  lunes: "L",
  martes: "M",
  miércoles: "X",
  jueves: "J",
  viernes: "V",
  sábado: "S",
  domingo: "D"
};

export function BulkClassesPreviewPanel({
  clubName,
  selectedCourtNumbers,
  selectedTrainerNames,
  baseConfig,
  multiplicationConfig,
  generatedClassesCount,
  generatedClassesPreview,
  step
}: BulkClassesPreviewPanelProps) {
  const hasBaseConfig = baseConfig.name && selectedCourtNumbers.length > 0 && selectedTrainerNames.length > 0;
  const hasMultiplication = multiplicationConfig.days_of_week.length > 0 && multiplicationConfig.time_slots.length > 0;

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-sm rounded-2xl overflow-hidden sticky top-24">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
          Vista Previa
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 px-4">
        <div className="space-y-3">
          {/* Header Row: Class Name + Club */}
          <div className="grid grid-cols-2 gap-3">
            {baseConfig.name && (
              <div className={`text-lg font-bold ${!baseConfig.name ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                {baseConfig.name || "Sin nombre"}
              </div>
            )}

            {clubName && (
              <div className="flex items-center justify-end gap-2">
                <MapPin className="h-3 w-3 text-primary" />
                <Badge variant="secondary" className="bg-white text-slate-700 border-slate-300 text-xs">
                  {clubName}
                </Badge>
              </div>
            )}
          </div>

          {/* Info Cards - Grid 2 columns */}
          {hasBaseConfig && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    Nivel
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {baseConfig.level_from === baseConfig.level_to
                      ? `Nivel ${baseConfig.level_from}`
                      : `${baseConfig.level_from} - ${baseConfig.level_to}`
                    }
                  </div>
                </div>

                <div className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock className="h-3 w-3 text-primary" />
                    Hora
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {baseConfig.first_class_time || "-"}
                  </div>
                </div>

                <div className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Zap className="h-3 w-3 text-primary" />
                    Duración
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {baseConfig.duration_minutes ? `${baseConfig.duration_minutes} min` : "-"}
                  </div>
                </div>

                <div className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <DollarSign className="h-3 w-3 text-primary" />
                    Precio
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {baseConfig.monthly_price ? `${baseConfig.monthly_price}€` : "-"}
                  </div>
                </div>
              </div>

              {/* Horizontal Layout: Pistas + Entrenadores */}
              {(selectedCourtNumbers.length > 0 || selectedTrainerNames.length > 0) && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Pistas */}
                  {selectedCourtNumbers.length > 0 && (
                    <div className="p-2 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-slate-200/60">
                      <p className="text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Pistas ({selectedCourtNumbers.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCourtNumbers.map((court) => (
                          <Badge key={court} variant="secondary" className="bg-white text-slate-700 border-slate-300 text-xs">
                            P{court}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entrenadores */}
                  {selectedTrainerNames.length > 0 && (
                    <div className="p-2 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-slate-200/60">
                      <p className="text-xs text-slate-600 mb-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Entrenadores ({selectedTrainerNames.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTrainerNames.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="bg-white/80 text-slate-700 border-slate-300 text-xs">
                            {name.split(' ')[0]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multiplication Configuration - Full Width */}
              {hasMultiplication && (
                <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50/30 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
                    <Zap className="h-3 w-3 text-primary" />
                    Multiplicación
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Days */}
                    {multiplicationConfig.days_of_week.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Días ({multiplicationConfig.days_of_week.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {multiplicationConfig.days_of_week.map((day) => (
                            <Badge key={day} variant="secondary" className="bg-white text-slate-700 border-slate-300 text-xs">
                              {DAY_LABELS[day] || day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Time slots */}
                    {multiplicationConfig.time_slots.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Tramos ({multiplicationConfig.time_slots.length})</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {multiplicationConfig.time_slots.map((slot, idx) => (
                            <div key={idx} className="text-xs bg-white rounded px-2 py-1 border border-slate-200/60 font-medium text-slate-700">
                              {slot.start}-{slot.end} ({slot.interval}min)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Classes - Full Width with Horizontal Grid */}
              {generatedClassesCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CalendarDays className="h-3 w-3 text-primary" />
                      Clases a Generar
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      {generatedClassesCount}
                    </Badge>
                  </div>

                  {generatedClassesPreview.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto pr-1">
                      {generatedClassesPreview.slice(0, 20).map((cls, idx) => (
                        <div
                          key={idx}
                          className="text-xs py-1.5 px-2 bg-slate-50 rounded border border-slate-200/60 hover:bg-slate-100 transition-colors flex items-center justify-between gap-1"
                        >
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <Badge variant="outline" className="text-xs shrink-0 bg-white border-slate-300 px-1">
                              {DAY_LABELS[cls.day_of_week]}
                            </Badge>
                            <span className="font-mono font-medium text-slate-700 shrink-0 text-xs">{cls.start_time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-600 text-xs">P{cls.court_number}</span>
                          </div>
                        </div>
                      ))}
                      {generatedClassesPreview.length > 20 && (
                        <div className="col-span-2 text-xs text-center text-slate-600 py-1 font-medium">
                          +{generatedClassesPreview.length - 20} más...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!hasBaseConfig && (
            <div className="text-center py-12 text-sm text-slate-500">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="font-medium">Completa la configuración</p>
              <p className="text-xs mt-1">para ver la vista previa</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
