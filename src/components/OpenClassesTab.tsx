import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, UserPlus, Lock, LockOpen, MapPin, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useUpdateProgrammedClass } from "@/hooks/useProgrammedClasses";
import { useClassEnrollmentRequests, useAcceptEnrollmentRequest, useRejectEnrollmentRequest } from "@/hooks/useEnrollmentRequests";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Componente para mostrar solicitudes de inscripción
const EnrollmentRequestsSection = ({
  classId,
  expandedClass,
  setExpandedClass,
  acceptRequest,
  rejectRequest
}: {
  classId: string;
  expandedClass: string | null;
  setExpandedClass: (id: string | null) => void;
  acceptRequest: any;
  rejectRequest: any;
}) => {
  const { data: requests, isLoading } = useClassEnrollmentRequests(classId);
  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];

  if (isLoading) return null;
  if (pendingRequests.length === 0) return null;

  const isExpanded = expandedClass === classId;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => setExpandedClass(isExpanded ? null : classId)}
      className="mt-3 pt-3 border-t"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="font-medium">
              {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? 'es' : ''} pendiente{pendingRequests.length !== 1 ? 's' : ''}
            </span>
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-2">
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {request.student_profile?.full_name}
                </p>
                <p className="text-xs text-gray-600">
                  {request.student_profile?.email}
                </p>
                {request.notes && (
                  <p className="text-xs text-gray-700 mt-2 italic">
                    "{request.notes}"
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Solicitado: {new Date(request.requested_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => acceptRequest.mutate(request.id)}
                disabled={acceptRequest.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectRequest.mutate({ requestId: request.id })}
                disabled={rejectRequest.isPending}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

const OpenClassesTab = () => {
  const { profile } = useAuth();
  const { data: allClasses, isLoading } = useProgrammedClasses(profile?.club_id);
  const updateClass = useUpdateProgrammedClass();
  const acceptRequest = useAcceptEnrollmentRequest();
  const rejectRequest = useRejectEnrollmentRequest();
  const { toast } = useToast();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  // Filtrar solo las clases con is_open = true
  const classes = allClasses?.filter(cls => cls.is_open === true) || [];

  const formatDaysOfWeek = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      'lunes': 'L',
      'martes': 'M',
      'miercoles': 'X',
      'jueves': 'J',
      'viernes': 'V',
      'sabado': 'S',
      'domingo': 'D'
    };
    return days.map(d => dayNames[d] || d).join(', ');
  };

  const getLevelDisplay = (classItem: any) => {
    if (classItem.custom_level) {
      return classItem.custom_level;
    }
    if (classItem.level_from && classItem.level_to) {
      return `Nivel ${classItem.level_from} - ${classItem.level_to}`;
    }
    if (classItem.level_from) {
      return `Nivel ${classItem.level_from}`;
    }
    return 'Todos los niveles';
  };

  const getAvailableSpots = (classItem: any) => {
    const activeParticipants = classItem.participants?.filter((p: any) => p.status === 'active').length || 0;
    const maxParticipants = classItem.max_participants || 0;
    return maxParticipants - activeParticipants;
  };

  const handleToggleOpen = async (classId: string) => {
    try {
      await updateClass.mutateAsync({
        id: classId,
        data: { is_open: false }
      });

      toast({
        title: "Clase cerrada",
        description: "La clase ya no aparecerá en 'Clases Disponibles' para los jugadores.",
      });
    } catch (error) {
      console.error('Error closing class:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la clase. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LockOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay clases abiertas</h3>
          <p className="text-sm text-muted-foreground text-center">
            Actualmente no hay clases abiertas para inscripción en tu club.
            <br />
            Puedes abrir clases desde el formulario de edición de cada clase.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clases Abiertas para Inscripción</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Estas clases están visibles para los jugadores en "Clases Disponibles"
          </p>
        </div>
        <Badge variant="default" className="text-sm bg-green-600">
          {classes.length} {classes.length === 1 ? 'clase abierta' : 'clases abiertas'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {classes.map((classItem) => {
          const availableSpots = getAvailableSpots(classItem);
          const levelDisplay = getLevelDisplay(classItem);
          const hasSpots = availableSpots > 0;

          return (
            <Card key={classItem.id} className="border-2 border-green-300 bg-green-50/30">
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base truncate">{classItem.name}</CardTitle>
                      <LockOpen className="h-4 w-4 text-green-600 flex-shrink-0" />
                    </div>
                    <CardDescription className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {classItem.start_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDaysOfWeek(classItem.days_of_week)}
                        </span>
                      </div>
                      {classItem.trainer && (
                        <div className="flex items-center gap-1">
                          <span className="truncate">{classItem.trainer.full_name}</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Abierta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-xs">
                      {classItem.participants?.filter((p: any) => p.status === 'active').length || 0} / {classItem.max_participants || 0} alumnos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-gray-500" />
                    <span className={`text-xs font-medium ${hasSpots ? 'text-green-600' : 'text-orange-600'}`}>
                      {hasSpots ? `${availableSpots} ${availableSpots === 1 ? 'plaza' : 'plazas'}` : 'Completa'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {levelDisplay}
                  </Badge>
                  {classItem.monthly_price && (
                    <Badge variant="outline" className="text-xs">
                      {classItem.monthly_price}€/mes
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex-1">
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Visible en 'Clases Disponibles' para jugadores
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleOpen(classItem.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Cerrar clase
                  </Button>
                </div>

                {/* Solicitudes de Inscripción */}
                <EnrollmentRequestsSection
                  classId={classItem.id}
                  expandedClass={expandedClass}
                  setExpandedClass={setExpandedClass}
                  acceptRequest={acceptRequest}
                  rejectRequest={rejectRequest}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default OpenClassesTab;
