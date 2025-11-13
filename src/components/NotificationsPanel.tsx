import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUnresolvedNotifications,
  useMarkNotificationAsRead,
  useResolveNotification,
  type StudentScoreNotification,
} from "@/hooks/useScoreNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  User,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationsPanelProps {
  clubId?: string;
  showResolved?: boolean;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  clubId,
  showResolved = false,
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<StudentScoreNotification | null>(
    null
  );
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: notifications, isLoading } = useUnresolvedNotifications(clubId);
  const markAsRead = useMarkNotificationAsRead();
  const resolveNotification = useResolveNotification();

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          color: "bg-red-100 border-red-300",
          textColor: "text-red-900",
          icon: AlertTriangle,
          iconColor: "text-red-600",
          badge: "destructive" as const,
        };
      case "warning":
        return {
          color: "bg-orange-100 border-orange-300",
          textColor: "text-orange-900",
          icon: AlertTriangle,
          iconColor: "text-orange-600",
          badge: "default" as const,
        };
      case "info":
        return {
          color: "bg-blue-100 border-blue-300",
          textColor: "text-blue-900",
          icon: AlertTriangle,
          iconColor: "text-blue-600",
          badge: "secondary" as const,
        };
      default:
        return {
          color: "bg-gray-100 border-gray-300",
          textColor: "text-gray-900",
          icon: AlertTriangle,
          iconColor: "text-gray-600",
          badge: "outline" as const,
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "negative_streak":
        return "Racha Negativa";
      case "low_score":
        return "Score Bajo";
      case "multiple_no_shows":
        return "Múltiples No-Shows";
      case "monthly_report":
        return "Reporte Mensual";
      default:
        return type;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleResolve = async () => {
    if (!selectedNotification || !profile?.id) return;

    try {
      await resolveNotification.mutateAsync({
        notificationId: selectedNotification.id,
        resolutionNotes,
        resolvedBy: profile.id,
      });
      setSelectedNotification(null);
      setResolutionNotes("");
    } catch (error) {
      console.error("Error resolving notification:", error);
    }
  };

  const handleViewStudent = (studentEnrollmentId: string) => {
    navigate(`/dashboard/students/${studentEnrollmentId}/score`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay notificaciones pendientes</h3>
          <p className="text-sm text-muted-foreground text-center">
            Todas las alertas han sido resueltas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {notifications.map((notification) => {
          const config = getSeverityConfig(notification.severity);
          const Icon = config.icon;

          return (
            <Card
              key={notification.id}
              className={`border-2 ${config.color} ${!notification.is_read ? "shadow-lg" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-6 w-6 ${config.iconColor} mt-1`} />
                    <div>
                      <CardTitle className={`text-lg ${config.textColor}`}>
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={config.badge}>{getTypeLabel(notification.notification_type)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), "d MMM yyyy, HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <Badge variant="default" className="bg-blue-500">
                      Nueva
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información del alumno */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {notification.student_enrollment?.full_name || "Sin nombre"}
                  </span>
                  <span className="text-muted-foreground">
                    ({notification.student_enrollment?.email})
                  </span>
                </div>

                {/* Mensaje */}
                <p className="text-sm">{notification.message}</p>

                {/* Métricas en el momento de la notificación */}
                <div className="flex gap-4 text-sm">
                  {notification.score_at_notification !== null && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      <span>Score: {notification.score_at_notification}</span>
                    </div>
                  )}
                  {notification.no_shows_at_notification !== null &&
                    notification.no_shows_at_notification > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>No-shows: {notification.no_shows_at_notification}</span>
                      </div>
                    )}
                  {notification.recent_failures_at_notification !== null &&
                    notification.recent_failures_at_notification > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span>Fallos recientes: {notification.recent_failures_at_notification}/3</span>
                      </div>
                    )}
                </div>

                {/* Plan de acción */}
                {notification.action_plan && (
                  <div className="bg-white p-3 rounded-md border">
                    <p className="text-xs font-semibold mb-2">PLAN DE ACCIÓN SUGERIDO:</p>
                    <pre className="text-xs whitespace-pre-wrap font-sans">
                      {notification.action_plan}
                    </pre>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStudent(notification.student_enrollment_id)}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    Ver Alumno
                  </Button>
                  {!notification.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markAsRead.isPending}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Marcar Leída
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedNotification(notification)}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Resolver
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog para resolver notificación */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Notificación</DialogTitle>
            <DialogDescription>
              Marca esta notificación como resuelta y añade notas sobre las acciones tomadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedNotification && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-semibold text-sm">{selectedNotification.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedNotification.student_enrollment?.full_name}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notas de resolución (opcional)
              </label>
              <Textarea
                placeholder="Describe las acciones tomadas para resolver esta alerta..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNotification(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolveNotification.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Marcar como Resuelta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationsPanel;
