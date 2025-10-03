import { useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight, User, Mail, Phone, Calendar } from "lucide-react";
import { useEnrollmentFormByToken, useCompleteEnrollmentForm } from "@/hooks/useStudentEnrollments";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import { toast } from "@/hooks/use-toast";

const StudentEnrollmentLink = () => {
  const { token } = useParams<{ token: string }>();
  const [showForm, setShowForm] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState<string>("");

  const { data: enrollmentForm, isLoading, error } = useEnrollmentFormByToken(token || "");
  const completeEnrollmentMutation = useCompleteEnrollmentForm();

  // Countdown effect for redirect
  useEffect(() => {
    if (redirecting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (redirecting && countdown === 0) {
      window.location.href = "/auth";
    }
  }, [redirecting, countdown]);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-playtomic-dark via-playtomic-dark to-playtomic-orange/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <Loader2 className="animate-spin h-12 w-12 text-playtomic-orange mx-auto mb-6" />
            <p className="text-lg font-medium">Verificando enlace de inscripción...</p>
            <p className="text-sm text-muted-foreground mt-2">Por favor espera un momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !enrollmentForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-lg">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Enlace Inválido</CardTitle>
            <CardDescription className="text-base mt-2">
              Este enlace de inscripción no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-muted-foreground mb-6">
              Por favor, contacta con tu profesor para obtener un nuevo enlace de inscripción.
            </p>
            <Button
              onClick={() => window.location.href = "/auth"}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
            >
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enrollmentForm.status === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Inscripción Completada</CardTitle>
            <CardDescription className="text-base mt-2">
              Tu inscripción ya ha sido procesada correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-muted-foreground mb-6">
              Gracias por completar tu inscripción. Tu profesor se pondrá en contacto contigo pronto.
            </p>
            <Button
              onClick={() => window.location.href = "/auth"}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
            >
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if link is expired
  const isExpired = new Date(enrollmentForm.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-lg">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">Enlace Expirado</CardTitle>
            <CardDescription className="text-base mt-2">
              Este enlace de inscripción ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-muted-foreground mb-6">
              Por favor, contacta con tu profesor para obtener un nuevo enlace de inscripción.
            </p>
            <Button
              onClick={() => window.location.href = "/auth"}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600"
            >
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success redirect screen
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-playtomic-dark via-playtomic-dark to-playtomic-orange/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-0 shadow-2xl bg-card">
          <CardContent className="text-center py-12 px-8">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-gradient-to-br from-playtomic-orange to-orange-600 flex items-center justify-center shadow-xl animate-pulse">
              <CheckCircle className="h-14 w-14 text-white" />
            </div>

            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-playtomic-orange to-orange-600 bg-clip-text text-transparent">
              ¡Inscripción Completada!
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Tu cuenta ha sido creada exitosamente
            </p>

            <div className="bg-gradient-to-r from-playtomic-orange/10 to-orange-600/10 border border-playtomic-orange/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                <User className="h-5 w-5 text-playtomic-orange" />
                Tus credenciales de acceso
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-playtomic-orange flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{userEmail}</p>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    ✓ Contraseña configurada correctamente
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-2">
                Serás redirigido al inicio de sesión en
              </p>
              <div className="text-5xl font-bold text-playtomic-orange">
                {countdown}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                segundos
              </p>
            </div>

            <Button
              onClick={() => window.location.href = "/auth"}
              className="w-full bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white shadow-lg"
            >
              Ir al inicio de sesión ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showForm) {
    const daysRemaining = Math.ceil((new Date(enrollmentForm.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div
        className="min-h-screen w-screen bg-gradient-to-br from-playtomic-dark via-playtomic-dark to-playtomic-orange/10 p-4"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto'
        }}
      >
        <Card className="max-w-2xl w-full border-0 shadow-2xl bg-card/95 backdrop-blur-sm" style={{ margin: 'auto' }}>
          <CardHeader className="text-center pb-6 pt-12">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-gradient-to-br from-playtomic-orange/20 to-playtomic-orange/30 flex items-center justify-center shadow-xl">
              <User className="h-12 w-12 text-playtomic-orange" />
            </div>
            <CardTitle className="text-4xl font-bold mb-4 bg-gradient-to-r from-playtomic-orange to-orange-600 bg-clip-text text-transparent">
              Completa tu Inscripción
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Has sido invitado a unirte a nuestra escuela de pádel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-12 px-8">
            <div className="bg-gradient-to-r from-playtomic-orange/10 to-orange-600/10 rounded-xl p-6 border border-playtomic-orange/20">
              <p className="text-center text-muted-foreground leading-relaxed">
                Tu profesor te ha enviado este enlace para que completes tu inscripción en la escuela.
                El proceso es rápido y sencillo. Solo necesitarás proporcionar algunos datos básicos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-playtomic-orange/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-playtomic-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Datos personales</p>
                  <p className="text-xs text-muted-foreground">Nombre y contacto</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-playtomic-orange/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-playtomic-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nivel de juego</p>
                  <p className="text-xs text-muted-foreground">Tu nivel actual</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-playtomic-orange/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-playtomic-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Disponibilidad</p>
                  <p className="text-xs text-muted-foreground">Días y horarios</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="w-full bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white text-lg h-14 shadow-lg"
            >
              Comenzar Inscripción
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Este enlace expira en {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-screen bg-gradient-to-br from-playtomic-dark via-playtomic-dark to-playtomic-orange/10 py-8 px-4"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto'
      }}
    >
      <div className="w-full max-w-5xl" style={{ margin: 'auto' }}>
        <StudentEnrollmentForm
          isPlayerMode={true}
          enrollmentToken={token}
          onClose={() => setShowForm(false)}
          onSuccess={(email: string) => {
            setUserEmail(email);
            setRedirecting(true);
          }}
          trainerProfile={{
            id: enrollmentForm.trainer_profile_id,
            club_id: enrollmentForm.club_id
          }}
        />
      </div>
    </div>
  );
};

export default StudentEnrollmentLink;