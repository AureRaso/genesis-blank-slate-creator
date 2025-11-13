import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStudentScore,
  useStudentScoreHistory,
  useCalculateStudentScore,
} from "@/hooks/useStudentScoring";
import StudentScoreCard from "@/components/StudentScoreCard";
import StudentAlertBanner from "@/components/StudentAlertBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const StudentScoreDetailPage = () => {
  const { studentEnrollmentId } = useParams<{ studentEnrollmentId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Queries
  const { data: scoreData, isLoading: loadingScore } = useStudentScore(studentEnrollmentId);
  const { data: scoreHistory, isLoading: loadingHistory } = useStudentScoreHistory(
    studentEnrollmentId,
    30
  );
  const calculateScore = useCalculateStudentScore();

  if (loadingScore) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos del alumno...</p>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontró el alumno</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              No hay datos de score para este alumno
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar datos para la gráfica
  const chartData = scoreHistory?.map((record) => ({
    date: format(new Date(record.recorded_at), "d MMM", { locale: es }),
    score: record.score,
    fullDate: format(new Date(record.recorded_at), "d 'de' MMMM, yyyy", { locale: es }),
    category: record.score_category,
  }));

  // Calcular tendencia
  const scoreChange =
    chartData && chartData.length >= 2
      ? chartData[chartData.length - 1].score - chartData[0].score
      : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.fullDate}</p>
          <p className="text-2xl font-bold text-playtomic-orange">{data.score}</p>
          <p className="text-xs text-muted-foreground capitalize">{data.category}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Alert Banner */}
      <StudentAlertBanner scoreData={scoreData} showDetails={true} />

      {/* Score Card */}
      <StudentScoreCard
        scoreData={scoreData}
        onRecalculate={() => calculateScore.mutate(studentEnrollmentId!)}
        isRecalculating={calculateScore.isPending}
        compact={false}
      />

      {/* Gráfico de Evolución */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Evolución del Score
              </CardTitle>
              <CardDescription>Últimos 30 registros de cambios en el score</CardDescription>
            </div>
            {scoreChange !== 0 && (
              <div className="flex items-center gap-2">
                {scoreChange > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      +{scoreChange} puntos
                    </Badge>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive">{scoreChange} puntos</Badge>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-playtomic-orange mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando historial...</p>
              </div>
            </div>
          ) : chartData && chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={90} stroke="#16a34a" strokeDasharray="3 3" label="Excelente" />
                  <ReferenceLine y={75} stroke="#2563eb" strokeDasharray="3 3" label="Bueno" />
                  <ReferenceLine y={60} stroke="#ca8a04" strokeDasharray="3 3" label="Regular" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#e74c3c"
                    strokeWidth={3}
                    dot={{ fill: "#e74c3c", r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay historial disponible para este alumno
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confirmaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confirmaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">Confirmadas</p>
                  <p className="text-xs text-muted-foreground">Aceptó asistir</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {scoreData.total_confirmed_attendance}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold">Rechazadas</p>
                  <p className="text-xs text-muted-foreground">Canceló asistencia</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {scoreData.total_confirmed_absence}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold">Sin respuesta</p>
                  <p className="text-xs text-muted-foreground">No respondió</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-600">{scoreData.total_no_response}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cumplimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cumplimiento Real</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Confirmó y vino</p>
                <p className="text-xs text-muted-foreground">Comportamiento perfecto</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {scoreData.actually_attended_when_confirmed}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 border-red-200">
              <div>
                <p className="font-semibold">Confirmó pero no vino</p>
                <p className="text-xs text-muted-foreground">No-shows críticos</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {scoreData.no_show_when_confirmed}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-semibold">Vino sin confirmar</p>
                <p className="text-xs text-muted-foreground">No avisó pero asistió</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {scoreData.attended_without_confirmation}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">No confirmó y no vino</p>
                <p className="text-xs text-muted-foreground">Ausencia sin aviso</p>
              </div>
              <p className="text-2xl font-bold text-gray-600">
                {scoreData.absent_without_confirmation}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de cambios (tabla) */}
      {scoreHistory && scoreHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cambios</CardTitle>
            <CardDescription>
              Registro de todos los cambios en el score del alumno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Fecha
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Categoría
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Clases Totales
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      No-shows
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...scoreHistory].reverse().map((record, index) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">
                        {format(new Date(record.recorded_at), "d 'de' MMM, HH:mm", { locale: es })}
                      </td>
                      <td className="p-2">
                        <span className="text-lg font-bold">{record.score}</span>
                        {index > 0 && (
                          <span
                            className={`ml-2 text-xs ${
                              record.score - scoreHistory[scoreHistory.length - index].score > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {record.score - scoreHistory[scoreHistory.length - index].score > 0 ? "+" : ""}
                            {record.score - scoreHistory[scoreHistory.length - index].score}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={
                            record.score_category === "excellent"
                              ? "default"
                              : record.score_category === "good"
                              ? "secondary"
                              : record.score_category === "regular"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {record.score_category === "excellent"
                            ? "Excelente"
                            : record.score_category === "good"
                            ? "Bueno"
                            : record.score_category === "regular"
                            ? "Regular"
                            : "Problemático"}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">{record.total_classes}</td>
                      <td className="p-2 text-sm font-semibold text-red-600">
                        {record.no_show_when_confirmed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentScoreDetailPage;
