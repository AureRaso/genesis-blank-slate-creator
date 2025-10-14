import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useClassCapacity, useUserWaitlistPosition, useJoinWaitlist, useLeaveWaitlist } from "@/hooks/useWaitlist";
import { useCreateClassPayment } from "@/hooks/useClassPayment";
import { useCreateReservation } from "@/hooks/useClassReservations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, MapPin, User, Plus, Eye, Euro, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PlayerClassesWidgetProps {
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const PlayerClassesWidget = ({ limit = 3, showViewAll = true, onViewAll }: PlayerClassesWidgetProps) => {
  const { profile } = useAuth();
  const { data: programmedClasses, isLoading } = useProgrammedClasses(profile?.club_id);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  const handleClassClick = (programmedClass: any) => {
    setSelectedClass(programmedClass);
    setIsClassModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsClassModalOpen(false);
    setSelectedClass(null);
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMapping: { [key: string]: string } = {
      'lunes': 'L',
      'martes': 'M',
      'miercoles': 'X',
      'jueves': 'J',
      'viernes': 'V',
      'sabado': 'S',
      'domingo': 'D'
    };
    return days.map(day => dayMapping[day] || day.charAt(0).toUpperCase()).join(', ');
  };

  const getLevelDisplay = (programmedClass: any) => {
    if (programmedClass.custom_level) {
      return programmedClass.custom_level;
    }
    if (programmedClass.level_from && programmedClass.level_to) {
      return programmedClass.level_from === programmedClass.level_to 
        ? `Nivel ${programmedClass.level_from}`
        : `Niveles ${programmedClass.level_from}-${programmedClass.level_to}`;
    }
    return 'Sin nivel definido';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-3 border rounded-lg">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const classesToShow = limit ? programmedClasses?.slice(0, limit) : programmedClasses;

  if (!classesToShow || classesToShow.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-medium mb-2">No hay clases programadas</h3>
        <p className="text-sm text-muted-foreground mb-4">
          No hay clases programadas disponibles en tu club actualmente.
        </p>
        {showViewAll && onViewAll && (
          <Button onClick={onViewAll} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ver Clases Disponibles
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {classesToShow.map((programmedClass) => (
          <div 
            key={programmedClass.id} 
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => handleClassClick(programmedClass)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium truncate">{programmedClass.name}</div>
              <Badge variant="secondary" className="text-xs">
                {getLevelDisplay(programmedClass)}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDaysOfWeek(programmedClass.days_of_week)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{programmedClass.start_time}</span>
              </div>
              {programmedClass.trainer?.full_name && (
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{programmedClass.trainer.full_name}</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <ClassCapacityMini classId={programmedClass.id} />
              <Button variant="ghost" size="sm" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Ver detalles
              </Button>
            </div>
          </div>
        ))}
        
        {showViewAll && onViewAll && programmedClasses && programmedClasses.length > limit && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={onViewAll}
          >
            Ver {programmedClasses.length - limit} clases más
          </Button>
        )}
      </div>

      {/* Modal de detalles de clase */}
      <ClassDetailsModal 
        programmedClass={selectedClass}
        isOpen={isClassModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

// Componente para mostrar capacidad de forma compacta
const ClassCapacityMini = ({ classId }: { classId: string }) => {
  const { data: capacity } = useClassCapacity(classId);

  if (!capacity) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      <Users className="h-3 w-3" />
      <span>{capacity.currentParticipants}/{capacity.maxParticipants}</span>
      {capacity.waitlistCount > 0 && (
        <Badge variant="outline" className="text-xs h-4 px-1">
          +{capacity.waitlistCount}
        </Badge>
      )}
    </div>
  );
};

// Modal de detalles de clase con opción de lista de espera
const ClassDetailsModal = ({ programmedClass, isOpen, onClose }: {
  programmedClass: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { profile } = useAuth();
  const { data: capacity } = useClassCapacity(programmedClass?.id);
  const { data: waitlistPosition } = useUserWaitlistPosition(programmedClass?.id, profile?.id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const createPayment = useCreateClassPayment();
  const createReservation = useCreateReservation();
  const [notes, setNotes] = useState("");

  if (!programmedClass) return null;

  const handleJoinWaitlist = () => {
    if (profile?.id) {
      joinWaitlist.mutate({ classId: programmedClass.id, userId: profile.id });
    }
  };

  const handleLeaveWaitlist = () => {
    if (profile?.id) {
      leaveWaitlist.mutate({ classId: programmedClass.id, userId: profile.id });
    }
  };

  const handleDirectReservation = () => {
    createReservation.mutate({
      slot_id: programmedClass.id,
      notes
    });
    setNotes("");
    onClose();
  };

  const handlePaymentReservation = () => {
    createPayment.mutate({
      classId: programmedClass.id,
      className: programmedClass.name,
      trainerName: programmedClass.trainer?.full_name || 'Entrenador no asignado',
      monthlyPrice: programmedClass.monthly_price,
      notes
    });
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMapping: { [key: string]: string } = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days.map(day => dayMapping[day] || day).join(', ');
  };

  const getLevelDisplay = (programmedClass: any) => {
    if (programmedClass.custom_level) {
      return programmedClass.custom_level;
    }
    if (programmedClass.level_from && programmedClass.level_to) {
      return programmedClass.level_from === programmedClass.level_to 
        ? `Nivel ${programmedClass.level_from}`
        : `Niveles ${programmedClass.level_from}-${programmedClass.level_to}`;
    }
    return 'Sin nivel definido';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{programmedClass.name}</DialogTitle>
          <DialogDescription>
            Detalles de la clase programada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Nivel</div>
              <div className="text-muted-foreground">{getLevelDisplay(programmedClass)}</div>
            </div>
            <div>
              <div className="font-medium">Duración</div>
              <div className="text-muted-foreground">{programmedClass.duration_minutes} minutos</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDaysOfWeek(programmedClass.days_of_week)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{programmedClass.start_time}</span>
            </div>
            {programmedClass.court_number && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Pista {programmedClass.court_number}</span>
              </div>
            )}
            {programmedClass.trainer?.full_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Profesor: {programmedClass.trainer.full_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-medium">Periodo</div>
            <div className="text-muted-foreground">
              {new Date(programmedClass.start_date).toLocaleDateString()} - {new Date(programmedClass.end_date).toLocaleDateString()}
            </div>
          </div>

          {/* Mostrar alumnos inscritos si los hay */}
          {programmedClass.participants && programmedClass.participants.length > 0 && (
            <div>
              <div className="font-medium text-sm mb-2">Alumnos inscritos</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {programmedClass.participants
                  .filter((p: any) => p.status === 'active')
                  .map((participant: any) => (
                    <div key={participant.id} className="text-xs bg-muted px-2 py-1 rounded">
                      {participant.student_enrollment?.full_name}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Información de capacidad y botones de lista de espera */}
          {capacity && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>
                  {capacity.currentParticipants}/{capacity.maxParticipants} plazas ocupadas
                </span>
                {capacity.waitlistCount > 0 && (
                  <>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{capacity.waitlistCount} en lista de espera</span>
                  </>
                )}
              </div>

              {waitlistPosition ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Clock className="h-3 w-3" />
                    Posición {waitlistPosition.position} en lista de espera
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLeaveWaitlist}
                    disabled={leaveWaitlist.isPending}
                    className="w-full"
                  >
                    Salir de lista de espera
                  </Button>
                </div>
              ) : capacity.isFull ? (
                <Button
                  size="sm"
                  onClick={handleJoinWaitlist}
                  disabled={joinWaitlist.isPending}
                  className="w-full"
                >
                  {joinWaitlist.isPending ? "Uniéndose..." : "Unirse a lista de espera"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-amber-600 font-medium">
                      Inscripciones temporalmente pausadas
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estamos finalizando la configuración del sistema de pagos
                    </p>
                  </div>

                  {programmedClass.monthly_price > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-muted-foreground">
                        €{programmedClass.monthly_price}/mes
                      </div>
                    </div>
                  )}

                  <Button disabled size="sm" className="w-full bg-muted text-muted-foreground cursor-not-allowed">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {programmedClass.monthly_price > 0 ? "Inscribirse (En pausa)" : "Inscribirse (En pausa)"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerClassesWidget;