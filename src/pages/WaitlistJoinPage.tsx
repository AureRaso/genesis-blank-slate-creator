import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCanJoinWaitlist, useJoinWaitlist } from "@/hooks/useClassWaitlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Calendar, User, MapPin, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

const WaitlistJoinPage = () => {
  const { classId, date } = useParams<{ classId: string; date: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: canJoinData, isLoading: checkingEligibility } = useCanJoinWaitlist(classId || '', date || '');
  const { mutate: joinWaitlist, isPending: isJoining, isSuccess } = useJoinWaitlist();
  const [countdown, setCountdown] = useState(3);

  // Don't redirect to auth - let users see the waitlist info first
  // Authentication will be required when they click "Join Waitlist"

  // Redirect to dashboard after 3 seconds when successfully joined waitlist
  useEffect(() => {
    if (isSuccess) {
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Navigate after 3 seconds
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [isSuccess, navigate]);

  if (checkingEligibility) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center mx-auto">
          <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando disponibilidad...</p>
        </div>
      </div>
    );
  }

  // Show success screen with countdown when successfully joined
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 to-white w-full">
        <Card className="w-full max-w-md border-green-300 mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">¡Te has unido!</h3>
            <p className="text-center text-muted-foreground mb-4">
              Has sido añadido a la lista de espera correctamente.
              <br />
              El profesor revisará tu solicitud pronto.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirigiendo al dashboard en {countdown}s...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classId || !date) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 w-full">
        <Card className="w-full max-w-md border-destructive mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Enlace inválido</CardTitle>
            <CardDescription>El enlace que has seguido no es válido</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleJoinWaitlist = () => {
    if (canJoinData?.canJoin && canJoinData.enrollmentId) {
      joinWaitlist({
        classId,
        classDate: date,
        enrollmentId: canJoinData.enrollmentId
      });
    }
  };

  // Format date nicely
  const formattedDate = date ? format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : '';

  // Show error states
  if (canJoinData && !canJoinData.canJoin) {
    let icon = <AlertTriangle className="h-12 w-12 text-yellow-600" />;
    let title = "No disponible";
    let colorClass = "border-yellow-300";
    let bgClass = "bg-yellow-50";

    if (canJoinData.reason === 'class_started' || canJoinData.reason === 'class_not_found') {
      icon = <XCircle className="h-12 w-12 text-destructive" />;
      colorClass = "border-destructive";
      bgClass = "bg-red-50";
    } else if (canJoinData.reason === 'class_full') {
      icon = <XCircle className="h-12 w-12 text-orange-600" />;
      title = "Plaza cubierta";
      colorClass = "border-orange-300";
      bgClass = "bg-orange-50";
    } else if (canJoinData.reason === 'already_in_waitlist' || canJoinData.reason === 'already_accepted') {
      icon = <CheckCircle2 className="h-12 w-12 text-green-600" />;
      title = "Ya estás en lista";
      colorClass = "border-green-300";
      bgClass = "bg-green-50";
    } else if (canJoinData.reason === 'already_enrolled') {
      icon = <CheckCircle2 className="h-12 w-12 text-green-600" />;
      title = "Ya inscrito";
      colorClass = "border-green-300";
      bgClass = "bg-green-50";
    }

    return (
      <div className={`flex items-center justify-center min-h-screen p-4 w-full ${bgClass}`}>
        <Card className={`w-full max-w-md ${colorClass} mx-auto`}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {icon}
            <h3 className="text-lg font-semibold mb-2 mt-4">{title}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {canJoinData.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success screen - can join waitlist
  const classData = canJoinData?.classData;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-white w-full">
      <Card className="w-full max-w-2xl border-blue-200 mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">¡Plaza de clase disponible!</CardTitle>
          <CardDescription className="text-base">
            Un alumno ha cancelado su asistencia y hay una plaza disponible
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Class Info */}
          {classData && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-3">{classData.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{classData.start_time} ({classData.duration_minutes} min)</span>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <strong>Importante:</strong> Al unirte a la lista de espera, tu solicitud será revisada por el profesor.
                  Si eres aceptado, recibirás una confirmación y serás agregado automáticamente a la clase.
                </AlertDescription>
              </Alert>

              {/* Time limit info */}
              <div className="text-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                La lista de espera se cierra 3 horas antes de la clase
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-3">
                {authLoading ? (
                  <Button size="lg" className="w-full" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </Button>
                ) : !user ? (
                  // Not authenticated - show login button
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate('/auth', { state: { from: `/waitlist/${classId}/${date}` } })}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Iniciar sesión para unirme
                  </Button>
                ) : (
                  // Authenticated - show join button
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleJoinWaitlist}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uniéndose...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Unirme a la Lista de Espera
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  {user
                    ? 'Al hacer clic aceptas que tu solicitud sea revisada por el profesor'
                    : 'Necesitas iniciar sesión para unirte a la lista de espera'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitlistJoinPage;
