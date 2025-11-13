import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMonthlyReports,
  useGenerateMonthlyReport,
  type MonthlyReport,
} from "@/hooks/useScoreNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Award,
  RefreshCw,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlyReportCardProps {
  clubId?: string;
}

const MonthlyReportCard: React.FC<MonthlyReportCardProps> = ({ clubId }) => {
  const { profile } = useAuth();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: reports, isLoading } = useMonthlyReports(clubId);
  const generateReport = useGenerateMonthlyReport();

  // Filtrar reporte seleccionado
  const selectedReport = reports?.find(
    (r) => r.report_month === selectedMonth && r.report_year === selectedYear
  );

  const handleGenerateReport = async () => {
    if (!clubId) return;

    try {
      await generateReport.mutateAsync({
        clubId,
        month: selectedMonth,
        year: selectedYear,
      });
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(2024, month - 1, 1);
    return format(date, "MMMM", { locale: es });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando reportes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reporte Mensual de Asistencia
          </CardTitle>
          <CardDescription>Estadísticas y análisis mensual del comportamiento de alumnos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Mes</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Año</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => currentYear - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={generateReport.isPending}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${generateReport.isPending ? "animate-spin" : ""}`}
              />
              {selectedReport ? "Regenerar" : "Generar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar reporte si existe */}
      {selectedReport ? (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Alumnos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{selectedReport.total_students}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Score Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${getScoreColor(selectedReport.average_score)}`}>
                  {selectedReport.average_score.toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  % Asistencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {selectedReport.average_attendance_rate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  No-Shows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {selectedReport.total_no_shows_month}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribución por categorías */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-green-800 font-medium">⭐ Excelentes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedReport.students_excellent}
                  </p>
                  <p className="text-xs text-green-700">
                    {((selectedReport.students_excellent / selectedReport.total_students) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">✓ Buenos</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedReport.students_good}</p>
                  <p className="text-xs text-blue-700">
                    {((selectedReport.students_good / selectedReport.total_students) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium">⚠️ Regulares</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedReport.students_regular}
                  </p>
                  <p className="text-xs text-yellow-700">
                    {((selectedReport.students_regular / selectedReport.total_students) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <p className="text-sm text-red-800 font-medium">🚫 Problemáticos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedReport.students_problematic}
                  </p>
                  <p className="text-xs text-red-700">
                    {((selectedReport.students_problematic / selectedReport.total_students) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 alumnos */}
          {selectedReport.top_students && selectedReport.top_students.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top 5 Alumnos del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedReport.top_students.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="bg-yellow-500">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <span className={`text-xl font-bold ${getScoreColor(student.score)}`}>
                        {student.score}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alumnos problemáticos */}
          {selectedReport.problematic_students && selectedReport.problematic_students.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Alumnos que Requieren Atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedReport.problematic_students.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{student.name}</span>
                        <Badge variant="destructive">{student.score} pts</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.issues.map((issue, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendaciones */}
          {selectedReport.recommendations && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <FileText className="h-5 w-5" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans text-blue-900">
                  {selectedReport.recommendations}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground text-center">
            Reporte generado el{" "}
            {format(new Date(selectedReport.generated_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", {
              locale: es,
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay reporte para este periodo</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Genera un nuevo reporte para {getMonthName(selectedMonth)} {selectedYear}
            </p>
            <Button onClick={handleGenerateReport} disabled={generateReport.isPending} className="gap-2">
              <RefreshCw
                className={`h-4 w-4 ${generateReport.isPending ? "animate-spin" : ""}`}
              />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlyReportCard;
