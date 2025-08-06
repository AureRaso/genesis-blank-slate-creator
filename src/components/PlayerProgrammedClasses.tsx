import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useClassCapacity, useUserWaitlistPosition, useJoinWaitlist, useLeaveWaitlist } from "@/hooks/useWaitlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PlayerProgrammedClassesProps {
  clubId?: string;
}

const PlayerProgrammedClasses = ({ clubId }: PlayerProgrammedClassesProps) => {
  const { profile } = useAuth();
  const { data: programmedClasses, isLoading, error } = useProgrammedClasses(clubId);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get user's student enrollment to filter classes where they are participants
  const userClasses = programmedClasses?.filter(programmedClass => {
    // This would need to be enhanced to check if the user is actually enrolled in the class
    // For now, we show all classes from the user's club
    return true;
  }) || [];

  // Apply filters
  const filteredClasses = userClasses.filter(programmedClass => {
    const matchesSearch = programmedClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (programmedClass.custom_level && programmedClass.custom_level.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = !levelFilter || levelFilter === "all" || 
                        (programmedClass.level_from && programmedClass.level_to && 
                         levelFilter >= programmedClass.level_from.toString() && 
                         levelFilter <= programmedClass.level_to.toString()) ||
                        (programmedClass.custom_level && programmedClass.custom_level.toLowerCase().includes(levelFilter.toLowerCase()));
    
    const matchesDay = !dayFilter || dayFilter === "all" || programmedClass.days_of_week.includes(dayFilter);
    
    const matchesTrainer = !trainerFilter || trainerFilter === "all" || programmedClass.trainer_profile_id === trainerFilter;

    return matchesSearch && matchesLevel && matchesDay && matchesTrainer;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clases Disponibles</h2>
          <p className="text-muted-foreground">
            Todas las clases programadas en tu club - Apúntate o únete a lista de espera
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Búsqueda y Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <Input
                    placeholder="Nombre de clase o nivel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Nivel</label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los niveles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los niveles</SelectItem>
                      <SelectItem value="1">Nivel 1</SelectItem>
                      <SelectItem value="2">Nivel 2</SelectItem>
                      <SelectItem value="3">Nivel 3</SelectItem>
                      <SelectItem value="4">Nivel 4</SelectItem>
                      <SelectItem value="5">Nivel 5</SelectItem>
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Día de la semana</label>
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los días" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los días</SelectItem>
                      <SelectItem value="lunes">Lunes</SelectItem>
                      <SelectItem value="martes">Martes</SelectItem>
                      <SelectItem value="miercoles">Miércoles</SelectItem>
                      <SelectItem value="jueves">Jueves</SelectItem>
                      <SelectItem value="viernes">Viernes</SelectItem>
                      <SelectItem value="sabado">Sábado</SelectItem>
                      <SelectItem value="domingo">Domingo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setLevelFilter("all");
                      setDayFilter("all");
                      setTrainerFilter("all");
                    }}
                    className="w-full"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay clases disponibles</h3>
            <p className="text-muted-foreground">
              {searchTerm || levelFilter || dayFilter || trainerFilter
                ? "No se encontraron clases que coincidan con los filtros aplicados."
                : "No hay clases programadas disponibles en este momento."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((programmedClass) => (
            <ProgrammedClassCard key={programmedClass.id} programmedClass={programmedClass} />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente separado para cada tarjeta de clase con modal
const ProgrammedClassCard = ({ programmedClass }: { programmedClass: any }) => {
  const { profile } = useAuth();
  const { data: capacity } = useClassCapacity(programmedClass.id);
  const { data: waitlistPosition } = useUserWaitlistPosition(programmedClass.id, profile?.id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{programmedClass.name}</span>
            <Badge variant="secondary">
              {getLevelDisplay(programmedClass)}
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {programmedClass.duration_minutes} minutos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDaysOfWeek(programmedClass.days_of_week)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{programmedClass.start_time}</span>
          </div>

          {programmedClass.court_number && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Pista {programmedClass.court_number}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Periodo:</span>
            <span>{new Date(programmedClass.start_date).toLocaleDateString()} - {new Date(programmedClass.end_date).toLocaleDateString()}</span>
          </div>

          {programmedClass.trainer?.full_name && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Profesor: {programmedClass.trainer.full_name}</span>
            </div>
          )}

          <ClassCapacityInfo 
            classId={programmedClass.id}
            capacity={capacity}
            waitlistPosition={waitlistPosition}
            onJoinWaitlist={handleJoinWaitlist}
            onLeaveWaitlist={handleLeaveWaitlist}
            joinPending={joinWaitlist.isPending}
            leavePending={leaveWaitlist.isPending}
            showParticipants={true}
          />
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{programmedClass.name}</DialogTitle>
            <DialogDescription>
              Detalles de la clase y opciones de inscripción
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
                  <Users className="h-4 w-4 text-muted-foreground" />
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

            {/* Información de capacidad y botones de lista de espera */}
            <div className="space-y-3 pt-2 border-t">
              <ClassCapacityInfo 
                classId={programmedClass.id}
                capacity={capacity}
                waitlistPosition={waitlistPosition}
                onJoinWaitlist={handleJoinWaitlist}
                onLeaveWaitlist={handleLeaveWaitlist}
                joinPending={joinWaitlist.isPending}
                leavePending={leaveWaitlist.isPending}
                isModal={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componente para mostrar información de capacidad y botones de lista de espera
const ClassCapacityInfo = ({ 
  classId, 
  capacity, 
  waitlistPosition, 
  onJoinWaitlist, 
  onLeaveWaitlist, 
  joinPending, 
  leavePending,
  isModal = false,
  showParticipants = false 
}: {
  classId: string;
  capacity?: any;
  waitlistPosition?: any;
  onJoinWaitlist: () => void;
  onLeaveWaitlist: () => void;
  joinPending: boolean;
  leavePending: boolean;
  isModal?: boolean;
  showParticipants?: boolean;
}) => {
  // Si no tenemos la capacidad desde props, la obtenemos aquí
  const { data: fetchedCapacity } = useClassCapacity(classId);
  const actualCapacity = capacity || fetchedCapacity;

  if (!actualCapacity) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          <span>Cargando información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4" />
        <span>
          {actualCapacity.currentParticipants}/{actualCapacity.maxParticipants} plazas ocupadas
        </span>
        {actualCapacity.waitlistCount > 0 && (
          <>
            <Clock className="h-4 w-4 ml-2" />
            <span>{actualCapacity.waitlistCount} en lista de espera</span>
          </>
        )}
      </div>

      {/* Mostrar participantes si showParticipants es true */}
      {showParticipants && actualCapacity.participants && actualCapacity.participants.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">Alumnos inscritos:</p>
          <div className="space-y-1">
            {actualCapacity.participants
              .slice(0, 3)
              .map((participant: any) => (
                <div key={participant.id} className="text-xs bg-muted px-2 py-1 rounded">
                  {participant.student_enrollment?.full_name || 'Alumno sin nombre'}
                </div>
              ))}
            {actualCapacity.participants.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{actualCapacity.participants.length - 3} más...
              </div>
            )}
          </div>
        </div>
      )}

      {waitlistPosition ? (
        <div className={`flex ${isModal ? 'flex-col' : 'items-center'} gap-2`}>
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Posición {waitlistPosition.position} en lista de espera
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onLeaveWaitlist}
            disabled={leavePending}
            className={isModal ? 'w-full' : ''}
          >
            {leavePending ? "Saliendo..." : "Salir de lista"}
          </Button>
        </div>
      ) : actualCapacity.isFull ? (
        <Button
          size="sm"
          onClick={onJoinWaitlist}
          disabled={joinPending}
          className={isModal ? 'w-full' : ''}
          variant="outline"
        >
          {joinPending ? "Uniéndose..." : "Unirse a lista de espera"}
        </Button>
      ) : (
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          {actualCapacity.availableSpots} plaza{actualCapacity.availableSpots !== 1 ? 's' : ''} disponible{actualCapacity.availableSpots !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
};

export default PlayerProgrammedClasses;