import { AlertTriangle, XCircle, TrendingDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { type StudentScoreWithDetails } from "@/hooks/useStudentScoring";

interface StudentAlertBannerProps {
  scoreData: StudentScoreWithDetails;
  showDetails?: boolean;
}

/**
 * Componente que muestra alertas visuales para alumnos con problemas
 * - Racha negativa (2+ fallos en últimas 3 clases)
 * - No-shows acumulados
 * - Score problemático
 */
const StudentAlertBanner: React.FC<StudentAlertBannerProps> = ({ scoreData, showDetails = true }) => {
  const hasNegativeStreak = scoreData.recent_streak_type === "negative";
  const hasNoShows = scoreData.no_show_when_confirmed > 0;
  const isProblematic = scoreData.score_category === "problematic";

  // Si no hay alertas, no mostrar nada
  if (!hasNegativeStreak && !hasNoShows && !isProblematic) {
    return null;
  }

  // Determinar nivel de alerta (crítico, alto, medio)
  let alertLevel: "critical" | "high" | "medium" = "medium";
  if (hasNegativeStreak && scoreData.recent_failures >= 3) {
    alertLevel = "critical";
  } else if (hasNegativeStreak || scoreData.no_show_when_confirmed >= 3) {
    alertLevel = "high";
  }

  const alertConfig = {
    critical: {
      className: "border-red-600 bg-red-50",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      title: "🚨 ALERTA CRÍTICA",
      titleColor: "text-red-900",
    },
    high: {
      className: "border-orange-500 bg-orange-50",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      title: "⚠️ ALERTA IMPORTANTE",
      titleColor: "text-orange-900",
    },
    medium: {
      className: "border-yellow-500 bg-yellow-50",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      title: "⚠️ Alerta",
      titleColor: "text-yellow-900",
    },
  };

  const config = alertConfig[alertLevel];
  const Icon = config.icon;

  return (
    <Alert className={`border-2 ${config.className}`}>
      <Icon className={`h-5 w-5 ${config.iconColor}`} />
      <AlertTitle className={`font-bold ${config.titleColor}`}>{config.title}</AlertTitle>
      {showDetails && (
        <AlertDescription className="mt-2 space-y-2">
          {/* Racha negativa */}
          {hasNegativeStreak && (
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="font-semibold">Racha Negativa:</span>
              <Badge variant="destructive">
                {scoreData.recent_failures}/3 últimas clases confirmó pero no vino
              </Badge>
            </div>
          )}

          {/* No-shows acumulados */}
          {hasNoShows && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-semibold">No-shows totales:</span>
              <Badge variant="destructive">{scoreData.no_show_when_confirmed}</Badge>
            </div>
          )}

          {/* Score problemático */}
          {isProblematic && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold">Score problemático:</span>
              <Badge variant="destructive">{scoreData.score} puntos (menos de 60)</Badge>
            </div>
          )}

          {/* Acciones recomendadas */}
          {alertLevel === "critical" && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-sm font-semibold text-red-900">Acciones recomendadas:</p>
              <ul className="text-sm text-red-800 mt-1 space-y-1 list-disc list-inside">
                <li>Contactar al alumno inmediatamente</li>
                <li>Verificar si hay problemas personales o de horario</li>
                <li>Considerar cambio de grupo o nivel</li>
                {scoreData.no_show_when_confirmed >= 3 && (
                  <li>Evaluar posible penalización o baja temporal</li>
                )}
              </ul>
            </div>
          )}

          {alertLevel === "high" && (
            <div className="mt-3 pt-3 border-t border-orange-200">
              <p className="text-sm font-semibold text-orange-900">Acciones recomendadas:</p>
              <ul className="text-sm text-orange-800 mt-1 space-y-1 list-disc list-inside">
                <li>Contactar al alumno para entender la situación</li>
                <li>Recordar la importancia de confirmar asistencia</li>
                <li>Monitorear en las próximas clases</li>
              </ul>
            </div>
          )}
        </AlertDescription>
      )}
    </Alert>
  );
};

export default StudentAlertBanner;
