import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  RefreshCw,
} from "lucide-react";
import { type StudentScoreWithDetails, type ScoreCategory } from "@/hooks/useStudentScoring";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StudentScoreCardProps {
  scoreData: StudentScoreWithDetails;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
  compact?: boolean;
}

/**
 * Obtiene el color, icono y texto para cada categoría de score
 */
export function getScoreCategoryDetails(category: ScoreCategory) {
  switch (category) {
    case 'excellent':
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        badgeVariant: 'default' as const,
        icon: Star,
        label: 'Excelente',
        emoji: '⭐',
      };
    case 'good':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        badgeVariant: 'secondary' as const,
        icon: CheckCircle2,
        label: 'Bueno',
        emoji: '✓',
      };
    case 'regular':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        badgeVariant: 'outline' as const,
        icon: Minus,
        label: 'Regular',
        emoji: '⚠️',
      };
    case 'problematic':
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        badgeVariant: 'destructive' as const,
        icon: AlertTriangle,
        label: 'Problemático',
        emoji: '🚫',
      };
  }
}

/**
 * Obtiene el icono de tendencia
 */
function getStreakIcon(streakType: string | null) {
  switch (streakType) {
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'negative':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
}

const StudentScoreCard: React.FC<StudentScoreCardProps> = ({
  scoreData,
  onRecalculate,
  isRecalculating = false,
  compact = false,
}) => {
  const categoryDetails = getScoreCategoryDetails(scoreData.score_category);
  const CategoryIcon = categoryDetails.icon;

  // Calcular tasa de cumplimiento
  const fulfillmentRate = scoreData.total_confirmed_attendance > 0
    ? Math.round((scoreData.actually_attended_when_confirmed / scoreData.total_confirmed_attendance) * 100)
    : 0;

  // Calcular tasa de comunicación
  const totalClassesExcludingCancelled = scoreData.total_classes - scoreData.classes_cancelled_by_academy;
  const communicationRate = totalClassesExcludingCancelled > 0
    ? Math.round(
        ((scoreData.total_confirmed_attendance + scoreData.total_confirmed_absence) /
          totalClassesExcludingCancelled) *
          100
      )
    : 0;

  if (compact) {
    // VERSIÓN COMPACTA para listados
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Alumno + Score */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${categoryDetails.color}`}
              >
                <span className="text-lg font-bold">{scoreData.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {scoreData.student_enrollment?.full_name || 'Sin nombre'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={categoryDetails.badgeVariant} className="text-xs">
                    {categoryDetails.label}
                  </Badge>
                  {scoreData.recent_streak_type === 'negative' && (
                    <Badge variant="destructive" className="text-xs">
                      🚨 {scoreData.recent_failures}/3 fallos
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {scoreData.actually_attended_when_confirmed}
                </p>
                <p className="text-xs text-muted-foreground">Cumplidas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {scoreData.no_show_when_confirmed}
                </p>
                <p className="text-xs text-muted-foreground">No-shows</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // VERSIÓN COMPLETA para detalle
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-16 h-16 rounded-full ${categoryDetails.color}`}
            >
              <CategoryIcon className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {scoreData.student_enrollment?.full_name || 'Sin nombre'}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {scoreData.student_enrollment?.email || 'Sin email'}
              </CardDescription>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-5xl font-bold mb-1 ${categoryDetails.color.split(' ')[1]}`}>
              {scoreData.score}
            </div>
            <Badge variant={categoryDetails.badgeVariant} className="text-sm">
              {categoryDetails.emoji} {categoryDetails.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alerta de racha negativa */}
        {scoreData.recent_streak_type === 'negative' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="font-semibold text-red-900">⚠️ Racha Negativa Detectada</p>
            </div>
            <p className="text-sm text-red-700">
              {scoreData.recent_failures} de las últimas 3 clases: confirmó pero no asistió
            </p>
          </div>
        )}

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-3xl font-bold">{scoreData.total_classes}</p>
            <p className="text-xs text-muted-foreground mt-1">Clases totales</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {scoreData.actually_attended_when_confirmed}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cumplió</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{scoreData.no_show_when_confirmed}</p>
            <p className="text-xs text-muted-foreground mt-1">No-shows</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">
              {scoreData.attended_without_confirmation}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Sin confirmar</p>
          </div>
        </div>

        {/* Confirmaciones */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Confirmaciones</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-semibold">{scoreData.total_confirmed_attendance}</p>
                <p className="text-xs text-muted-foreground">Aceptadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="font-semibold">{scoreData.total_confirmed_absence}</p>
                <p className="text-xs text-muted-foreground">Rechazadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-semibold">{scoreData.total_no_response}</p>
                <p className="text-xs text-muted-foreground">Sin respuesta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasas de cumplimiento */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Tasa de Cumplimiento</span>
              <span className="font-semibold">{fulfillmentRate}%</span>
            </div>
            <Progress value={fulfillmentRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Vino cuando confirmó: {scoreData.actually_attended_when_confirmed}/
              {scoreData.total_confirmed_attendance}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Tasa de Comunicación</span>
              <span className="font-semibold">{communicationRate}%</span>
            </div>
            <Progress value={communicationRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Confirma antes de clase (no ignora mensajes)
            </p>
          </div>
        </div>

        {/* Componentes del score */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">Desglose del Score</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Cumplimiento (max 40)</span>
              <span className="font-semibold">+{scoreData.score_fulfillment.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Comunicación (max 30)</span>
              <span className="font-semibold">+{scoreData.score_communication.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cancelaciones (max 20)</span>
              <span className="font-semibold">+{scoreData.score_cancellation.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bonus Estabilidad (max 10)</span>
              <span className="font-semibold">+{scoreData.score_stability_bonus.toFixed(1)}</span>
            </div>
            {scoreData.score_penalties > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Penalizaciones</span>
                <span className="font-semibold">-{scoreData.score_penalties.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer con metadata */}
        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {getStreakIcon(scoreData.recent_streak_type)}
            <span>
              Última actualización:{' '}
              {format(new Date(scoreData.last_calculated_at), "d 'de' MMMM, HH:mm", { locale: es })}
            </span>
          </div>
          {onRecalculate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRecalculate}
              disabled={isRecalculating}
              className="gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalcular
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentScoreCard;
