
import { useState } from "react";
import { Clock, MapPin, Calendar, Target, User, UserPlus, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAvailableProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useCreateEnrollmentRequest, useMyEnrollmentRequests } from "@/hooks/useEnrollmentRequests";
import { useToast } from "@/hooks/use-toast";

const ClassBooking = () => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const { data: availableClasses, isLoading } = useAvailableProgrammedClasses();
  const { data: myRequests, isLoading: requestsLoading } = useMyEnrollmentRequests();
  const createRequest = useCreateEnrollmentRequest();
  const { toast } = useToast();

  // Función para obtener el estado de la solicitud para una clase
  const getRequestStatus = (classId: string) => {
    if (!myRequests) return null;
    return myRequests.find(req => req.programmed_class_id === classId);
  };

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

  const handleEnrollment = (classId: string) => {
    createRequest.mutate({ classId, notes });
    setNotes("");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-playtomic-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-playtomic-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 bg-playtomic-gray-200 rounded"></div>
              <div className="h-3 bg-playtomic-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!availableClasses?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-playtomic-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-playtomic-gray-900 mb-2">
            No hay clases disponibles
          </h3>
          <p className="text-playtomic-gray-600 text-center">
            En este momento no hay clases abiertas para inscripción. Vuelve a comprobar más tarde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableClasses.map((classItem) => {
          const availableSpots = getAvailableSpots(classItem);
          const levelDisplay = getLevelDisplay(classItem);
          const requestStatus = getRequestStatus(classItem.id);

          return (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow border-playtomic-orange/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-playtomic-gray-900">
                      {classItem.name}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.clubs?.name}</span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-playtomic-orange text-white">
                    {levelDisplay}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm font-medium">{formatDaysOfWeek(classItem.days_of_week)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm font-medium">{classItem.start_time} ({classItem.duration_minutes} min)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm font-medium">Entrenador: {classItem.trainer?.full_name || 'No asignado'}</span>
                  </div>

                  {classItem.monthly_price && (
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-playtomic-orange" />
                      <span className="text-sm font-medium">{classItem.monthly_price}€/mes</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4 text-playtomic-gray-500" />
                    <span className="text-playtomic-green font-medium">
                      {availableSpots > 0 ? `${availableSpots} plazas libres` : 'Completa'}
                    </span>
                  </div>
                </div>

                {/* Mostrar estado de la solicitud si existe */}
                {requestStatus && (
                  <div className={`p-3 rounded-lg border-2 ${
                    requestStatus.status === 'pending' ? 'bg-blue-50 border-blue-200' :
                    requestStatus.status === 'accepted' ? 'bg-green-50 border-green-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {requestStatus.status === 'pending' && (
                        <>
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          <span className="text-sm font-medium text-blue-700">Solicitud pendiente</span>
                        </>
                      )}
                      {requestStatus.status === 'accepted' && (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Solicitud aceptada</span>
                        </>
                      )}
                      {requestStatus.status === 'rejected' && (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Solicitud rechazada</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {requestStatus.status === 'pending' && 'El entrenador revisará tu solicitud pronto'}
                      {requestStatus.status === 'accepted' && 'Ya estás inscrito en esta clase'}
                      {requestStatus.status === 'rejected' && (requestStatus.rejection_reason || 'El entrenador ha rechazado tu solicitud')}
                    </p>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                      onClick={() => setSelectedClass(classItem.id)}
                      disabled={availableSpots <= 0 || (requestStatus?.status === 'pending' || requestStatus?.status === 'accepted')}
                    >
                      {requestStatus?.status === 'pending' ? 'Solicitud Pendiente' :
                       requestStatus?.status === 'accepted' ? 'Ya Inscrito' :
                       availableSpots > 0 ? 'Solicitar Inscripción' : 'Sin plazas'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Solicitar Inscripción</AlertDialogTitle>
                       <AlertDialogDescription asChild>
                         <div className="space-y-3">
                           <p>¿Deseas solicitar la inscripción en esta clase? El entrenador revisará tu solicitud y te confirmará.</p>
                           <div className="bg-playtomic-gray-50 p-3 rounded-lg space-y-2">
                             <p><strong>Clase:</strong> {classItem.name}</p>
                             <p><strong>Nivel:</strong> {levelDisplay}</p>
                             <p><strong>Club:</strong> {classItem.clubs?.name}</p>
                             <p><strong>Días:</strong> {formatDaysOfWeek(classItem.days_of_week)}</p>
                             <p><strong>Horario:</strong> {classItem.start_time}</p>
                             <p><strong>Entrenador:</strong> {classItem.trainer?.full_name || 'No asignado'}</p>
                             {classItem.monthly_price && (
                               <p><strong>Precio:</strong> {classItem.monthly_price}€/mes</p>
                             )}
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="notes">Información adicional (opcional)</Label>
                             <Textarea
                               id="notes"
                               placeholder="Ej: Nivel de experiencia, objetivos, disponibilidad..."
                               value={notes}
                               onChange={(e) => setNotes(e.target.value)}
                               rows={3}
                             />
                           </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setNotes("")}>
                        Cancelar
                      </AlertDialogCancel>
                       <AlertDialogAction
                         onClick={() => handleEnrollment(classItem.id)}
                         className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                         disabled={createRequest.isPending}
                       >
                         {createRequest.isPending ? "Enviando..." : "Solicitar Inscripción"}
                       </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ClassBooking;
