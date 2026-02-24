/**
 * OwnerClubReportPage
 *
 * Página para generar informes de valor PDF por club.
 * El owner selecciona un club y rango de fechas, y descarga un PDF de 7 páginas.
 *
 * IMPORTANTE: Solo accesible para rol owner.
 */

import { useState, useEffect } from "react";
import OwnerLayout from "@/components/OwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Download, FileText, Calendar as CalendarIcon, Building2, Info } from "lucide-react";
import { useClubsForFilter } from "@/hooks/useOwnerAbsencesWaitlist";
import { useClubValueReport, type ClubReportParams } from "@/hooks/useClubValueReport";
import { generateClubReportPDF } from "@/utils/generateClubReportPDF";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const OwnerClubReportPage = () => {
  const { toast } = useToast();
  const { data: clubs, isLoading: clubsLoading } = useClubsForFilter();

  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [dateTo, setDateTo] = useState<Date>(() => endOfMonth(subMonths(new Date(), 1)));
  const [reportParams, setReportParams] = useState<ClubReportParams | null>(null);
  const [generating, setGenerating] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const { data: reportData, isLoading: reportLoading, error: reportError, isFetching } = useClubValueReport(reportParams);

  // Generate PDF when data arrives
  useEffect(() => {
    if (reportData && generating) {
      generateClubReportPDF(reportData)
        .then(() => {
          toast({
            title: "Informe generado",
            description: `PDF descargado para ${reportData.club.name}`,
          });
        })
        .catch((err) => {
          console.error("Error generating PDF:", err);
          toast({
            title: "Error al generar PDF",
            description: "Hubo un error al crear el documento. Revisa la consola.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setGenerating(false);
          setReportParams(null);
        });
    }
  }, [reportData, generating]);

  // Handle errors
  useEffect(() => {
    if (reportError && generating) {
      console.error("Report fetch error:", reportError);
      toast({
        title: "Error al obtener datos",
        description: "No se pudieron cargar los datos del club. Revisa la consola.",
        variant: "destructive",
      });
      setGenerating(false);
      setReportParams(null);
    }
  }, [reportError, generating]);

  const handleGenerate = () => {
    if (!selectedClubId) {
      toast({
        title: "Selecciona un club",
        description: "Debes seleccionar un club para generar el informe.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setReportParams({
      clubId: selectedClubId,
      dateFrom: format(dateFrom, "yyyy-MM-dd"),
      dateTo: format(dateTo, "yyyy-MM-dd"),
    });
  };

  const isLoading = generating || reportLoading || isFetching;
  const selectedClubName = clubs?.find((c) => c.id === selectedClubId)?.name;

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Informe de Valor por Club</h1>
        <p className="text-slate-600">
          Genera un informe PDF completo con métricas de ocupación, listas de espera, sustituciones y valor recuperado para un club.
        </p>
      </div>

      {/* Config card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-playtomic-orange" />
            Configuración del Informe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Club selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Club
              </label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger>
                  <SelectValue placeholder={clubsLoading ? "Cargando..." : "Seleccionar club"} />
                </SelectTrigger>
                <SelectContent>
                  {clubs?.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                Desde
              </label>
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(dateFrom, "d MMM yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => {
                      if (d) {
                        setDateFrom(d);
                        setFromOpen(false);
                      }
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                Hasta
              </label>
              <Popover open={toOpen} onOpenChange={setToOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(dateTo, "d MMM yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => {
                      if (d) {
                        setDateTo(d);
                        setToOpen(false);
                      }
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate button */}
            <div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedClubId || isLoading}
                className="w-full bg-playtomic-orange hover:bg-playtomic-orange/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generar PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Selected info */}
          {selectedClubName && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              Se generará el informe de <strong>{selectedClubName}</strong> del{" "}
              <strong>{format(dateFrom, "d 'de' MMMM yyyy", { locale: es })}</strong> al{" "}
              <strong>{format(dateTo, "d 'de' MMMM yyyy", { locale: es })}</strong>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Contenido del Informe (7 páginas)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600">
                <p><strong>1.</strong> Portada con datos del club</p>
                <p><strong>2.</strong> Resumen ejecutivo con métricas clave</p>
                <p><strong>3.</strong> Análisis de ocupación por clase y día</p>
                <p><strong>4.</strong> Ausencias, sustituciones y valor recuperado</p>
                <p><strong>5.</strong> Análisis de alumnos y distribución por nivel</p>
                <p><strong>6.</strong> Actividad de entrenadores</p>
                <p><strong>7.</strong> Conclusiones y comparativa con la plataforma</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </OwnerLayout>
  );
};

export default OwnerClubReportPage;
