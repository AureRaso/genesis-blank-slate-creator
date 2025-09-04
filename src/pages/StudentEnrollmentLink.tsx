import { useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useEnrollmentFormByToken, useCompleteEnrollmentForm } from "@/hooks/useStudentEnrollments";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import { toast } from "@/hooks/use-toast";

const StudentEnrollmentLink = () => {
  const { token } = useParams<{ token: string }>();
  const [showForm, setShowForm] = useState(false);
  
  const { data: enrollmentForm, isLoading, error } = useEnrollmentFormByToken(token || "");
  const completeEnrollmentMutation = useCompleteEnrollmentForm();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
            <p>Verificando enlace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !enrollmentForm) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Enlace Inválido</CardTitle>
            <CardDescription>
              Este enlace de inscripción no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Por favor, contacta con tu profesor para obtener un nuevo enlace de inscripción.
            </p>
            <Button onClick={() => window.location.href = "/auth"}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enrollmentForm.status === "completed") {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Inscripción Completada</CardTitle>
            <CardDescription>
              Tu inscripción ya ha sido procesada correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Gracias por completar tu inscripción. Tu profesor se pondrá en contacto contigo pronto.
            </p>
            <Button onClick={() => window.location.href = "/auth"}>
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
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-yellow-600">Enlace Expirado</CardTitle>
            <CardDescription>
              Este enlace de inscripción ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Por favor, contacta con tu profesor para obtener un nuevo enlace de inscripción.
            </p>
            <Button onClick={() => window.location.href = "/auth"}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-playtomic-orange/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-playtomic-orange" />
            </div>
            <CardTitle>Completa tu Inscripción</CardTitle>
            <CardDescription>
              Has sido invitado a inscribirte en una escuela de pádel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Tu profesor te ha enviado este enlace para que puedas completar tu inscripción
                en la escuela de pádel.
              </p>
              <p>
                Necesitarás proporcionar tus datos personales, nivel de juego y disponibilidad.
              </p>
            </div>
            
            <Button onClick={() => setShowForm(true)} className="w-full">
              Comenzar Inscripción
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Tiempo restante: {Math.ceil((new Date(enrollmentForm.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <StudentEnrollmentForm
          isPlayerMode={true}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            toast({
              title: "¡Inscripción completada!",
              description: "Tu inscripción ha sido enviada correctamente. Serás redirigido al login.",
            });
            setTimeout(() => {
              window.location.href = "/auth";
            }, 2000);
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