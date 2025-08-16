import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Users, Calendar, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EnrollmentToken {
  id: string;
  token: string;
  class_id: string;
  available_spots: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  programmed_classes: {
    id: string;
    name: string;
    start_time: string;
    days_of_week: string[];
    max_participants: number;
    clubs: {
      name: string;
    };
  } | null;
}

const ClassEnrollmentPage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!token) {
        setError("Token de inscripción no válido");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('enrollment_tokens')
          .select(`
            *,
            programmed_classes!inner(
              id,
              name,
              start_time,
              days_of_week,
              max_participants,
              clubs!inner(name)
            )
          `)
          .eq('token', token)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .gt('available_spots', 0)
          .single();

        if (error || !data) {
          setError("El enlace de inscripción no es válido o ha expirado");
        } else {
          setEnrollmentData(data as any);
        }
      } catch (err) {
        setError("Error al verificar el enlace de inscripción");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentData();
  }, [token]);

  const handleEnrollment = async () => {
    if (!user || !enrollmentData) return;

    setEnrolling(true);
    try {
      // Verificar si el usuario ya está inscrito en esta clase
      const { data: existingParticipant, error: checkError } = await supabase
        .from('class_participants')
        .select('id')
        .eq('class_id', enrollmentData.class_id)
        .eq('student_enrollment_id', user.id)
        .eq('status', 'active')
        .single();

      if (existingParticipant) {
        toast({
          title: "Ya estás inscrito",
          description: "Ya estás inscrito en esta clase",
          variant: "destructive",
        });
        setEnrolling(false);
        return;
      }

      // Verificar disponibilidad actualizada
      const { data: currentToken, error: tokenError } = await supabase
        .from('enrollment_tokens')
        .select('available_spots, used_count')
        .eq('id', enrollmentData.id)
        .single();

      if (tokenError || !currentToken || currentToken.available_spots <= 0) {
        toast({
          title: "No hay plazas disponibles",
          description: "Las plazas se han agotado mientras procesábamos tu solicitud",
          variant: "destructive",
        });
        setEnrolling(false);
        return;
      }

      // Insertar participante en la clase
      const { error: participantError } = await supabase
        .from('class_participants')
        .insert([{
          class_id: enrollmentData.class_id,
          student_enrollment_id: user.id,
          status: 'active'
        }]);

      if (participantError) {
        throw participantError;
      }

      // Actualizar el token (reducir plazas disponibles, incrementar usado)
      const { error: updateError } = await supabase
        .from('enrollment_tokens')
        .update({
          available_spots: currentToken.available_spots - 1,
          used_count: currentToken.used_count + 1
        })
        .eq('id', enrollmentData.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "¡Inscripción exitosa!",
        description: `Te has inscrito correctamente en la clase ${enrollmentData.programmed_classes.name}`,
      });

      // Redirigir a las clases programadas o dashboard
      navigate('/scheduled-classes');

    } catch (err) {
      console.error('Error enrolling:', err);
      toast({
        title: "Error en la inscripción",
        description: "Hubo un problema al procesar tu inscripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Manejar autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p>Verificando autenticación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    // Guardar la URL actual para redirigir después del login
    const currentUrl = window.location.pathname;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p>Verificando enlace de inscripción...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Enlace no válido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollmentData) {
    return null;
  }

  const classData = enrollmentData.programmed_classes;
  
  if (!classData) {
    return null;
  }
  const daysInSpanish = {
    'monday': 'Lunes',
    'tuesday': 'Martes', 
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo',
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles', 
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  const expiresAt = new Date(enrollmentData.expires_at);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">¡Plaza Disponible!</CardTitle>
          <CardDescription>
            Inscríbete en esta clase de pádel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Detalles de la clase */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-lg mb-3">{classData.name}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Club: {classData.clubs.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Días: {classData.days_of_week.map(day => daysInSpanish[day as keyof typeof daysInSpanish] || day).join(', ')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Hora: {formatTime(classData.start_time)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Plazas disponibles: {enrollmentData.available_spots}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info del enlace */}
          <div className="text-center text-sm text-muted-foreground">
            <p>⏰ Este enlace expira en {hoursRemaining} horas</p>
          </div>

          {/* Botón de inscripción */}
          <Button 
            onClick={handleEnrollment}
            disabled={enrolling}
            className="w-full"
            size="lg"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando inscripción...
              </>
            ) : (
              "Reservar ahora esta clase"
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Al hacer clic confirmas tu inscripción en esta clase
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassEnrollmentPage;