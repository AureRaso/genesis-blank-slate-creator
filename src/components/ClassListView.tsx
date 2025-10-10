import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Clock, Users, MapPin, Edit, Trash2, Eye, UserPlus, UserMinus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManageStudentsModal } from "@/components/calendar/ManageStudentsModal";
import { EditClassModal } from "@/components/calendar/EditClassModal";
import { ClassListViewMobile } from "@/components/ClassListViewMobile";
import { useScheduledClasses, type ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";
import { useClassCapacity, useUserWaitlistPosition, useJoinWaitlist, useLeaveWaitlist } from "@/hooks/useWaitlist";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteProgrammedClass } from "@/hooks/useProgrammedClasses";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ClassFiltersData } from "@/contexts/ClassFiltersContext";
interface ClassListViewProps {
  clubId?: string;
  clubIds?: string[];
  filters: ClassFiltersData;
}
export default function ClassListView({
  clubId,
  clubIds,
  filters
}: ClassListViewProps) {
  const [selectedClass, setSelectedClass] = useState<ScheduledClassWithTemplate | null>(null);
  const [manageStudentsClass, setManageStudentsClass] = useState<ScheduledClassWithTemplate | null>(null);
  const [editingClass, setEditingClass] = useState<ScheduledClassWithTemplate | null>(null);
  const [deletingClass, setDeletingClass] = useState<ScheduledClassWithTemplate | null>(null);

  const deleteProgrammedClass = useDeleteProgrammedClass();
  const {
    t
  } = useTranslation();
  const {
    getDateFnsLocale
  } = useLanguage();
  const {
    isAdmin,
    isTrainer
  } = useAuth();
  const {
    data: classes,
    isLoading
  } = useScheduledClasses({
    clubId: clubId,
    clubIds: clubIds
  });

  // Sync selectedClass with fresh query data when it updates
  useEffect(() => {
    if (selectedClass && classes) {
      const updatedClass = classes.find(cls => cls.id === selectedClass.id);
      if (updatedClass) {
        setSelectedClass(updatedClass);
      }
    }
  }, [classes, selectedClass?.id]);

  // Aplicar todos los filtros
  const filteredClasses = classes?.filter(cls => {
    // Filtro de búsqueda existente
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = cls.name.toLowerCase().includes(searchLower) || cls.participants?.some(p => p.student_enrollment?.full_name?.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Filtro por tamaño de grupo
    const participantCount = cls.participants?.length || 0;
    if (filters.minGroupSize !== undefined && participantCount < filters.minGroupSize) return false;
    if (filters.maxGroupSize !== undefined && participantCount > filters.maxGroupSize) return false;

    // Filtro por nivel numérico
    if (filters.levelFrom !== undefined && cls.level_from !== undefined && cls.level_from < filters.levelFrom) return false;
    if (filters.levelTo !== undefined && cls.level_to !== undefined && cls.level_to > filters.levelTo) return false;

    // Filtro por niveles personalizados
    if (filters.customLevels.length > 0 && cls.custom_level) {
      if (!filters.customLevels.includes(cls.custom_level)) return false;
    }

    // Filtro por días de la semana
    if (filters.weekDays.length > 0) {
      const hasMatchingDay = cls.days_of_week.some(day => filters.weekDays.includes(day.toLowerCase()));
      if (!hasMatchingDay) return false;
    }

    // Filtro por nombre/email de alumno
    if (filters.studentName) {
      const studentNameLower = filters.studentName.toLowerCase();
      const hasMatchingStudent = cls.participants?.some(p => p.student_enrollment?.full_name?.toLowerCase().includes(studentNameLower) || p.student_enrollment?.email?.toLowerCase().includes(studentNameLower));
      if (!hasMatchingStudent) return false;
    }

    // Filtro por descuentos
    if (filters.withDiscountOnly) {
      const hasDiscount = cls.participants?.some(p => p.discount_1 !== null && p.discount_1 > 0 || p.discount_2 !== null && p.discount_2 > 0);
      if (!hasDiscount) return false;
    }
    return true;
  }) || [];
  const getLevelDisplay = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? `${t('classes.level')} ${cls.level_from}` : `${t('classes.level')} ${cls.level_from}-${cls.level_to}`;
    }
    return t('classes.withoutLevel');
  };
  const getLevelColor = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      if (cls.custom_level.includes('primera')) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.custom_level.includes('segunda')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (cls.custom_level.includes('tercera')) return 'bg-red-100 text-red-800 border-red-200';
    }
    if (cls.level_from) {
      if (cls.level_from <= 3) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.level_from <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardHeader>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span>{t('classes.classList')} ({filteredClasses.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {filteredClasses.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">
            {t('classes.noClassesFound')}
          </div> : <>
            {/* Mobile View */}
            <div className="block md:hidden">
              <ClassListViewMobile
                classes={filteredClasses}
                isAdmin={isAdmin}
                isTrainer={isTrainer}
                onViewDetails={(cls) => setSelectedClass(cls)}
                onEdit={(cls) => setEditingClass(cls)}
                onManageStudents={(cls) => setManageStudentsClass(cls)}
                getLevelDisplay={getLevelDisplay}
                getLevelColor={getLevelColor}
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('classes.className')}</TableHead>
                    <TableHead>{t('classes.schedule')}</TableHead>
                    <TableHead>{t('classes.students')}</TableHead>
                    <TableHead>{t('classes.period')}</TableHead>
                    <TableHead>{t('classes.days')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map(cls => {
                    const enrolledCount = cls.participants?.length || 0;
                    return <TableRow key={cls.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{cls.name}</div>
                          {cls.club && <div className="text-xs text-muted-foreground">
                            {cls.club.name}
                          </div>}
                          <div className="flex items-center gap-2">
                            <Badge className={getLevelColor(cls)}>
                              {getLevelDisplay(cls)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {cls.start_time.slice(0, 5)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cls.duration_minutes} {t('classes.min')}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{enrolledCount}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(cls.start_date), "dd/MM/yy")} - {format(parseISO(cls.end_date), "dd/MM/yy")}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {cls.days_of_week.join(', ')}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                            {(isAdmin || isTrainer) ? (
                              <>
                                <DropdownMenuItem onClick={() => setEditingClass(cls)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setManageStudentsClass(cls)}>
                                  <Users className="h-4 w-4 mr-2" />
                                  Gestionar alumnos
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeletingClass(cls)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('classes.cancelClass')}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => setSelectedClass(cls)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('classes.viewDetails')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            </div>
          </>}

        {/* Class details modal */}
        <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
          {selectedClass && (isAdmin || isTrainer ? <AdminClassDetailsModal class={selectedClass} onManageStudents={() => {
          setManageStudentsClass(selectedClass);
          setSelectedClass(null);
        }} onEditClass={() => {
          setEditingClass(selectedClass);
          setSelectedClass(null);
        }} /> : <PlayerClassDetailsModal class={selectedClass} />)}
        </Dialog>

        {/* Manage Students Modal */}
        {manageStudentsClass && <ManageStudentsModal class={manageStudentsClass} isOpen={!!manageStudentsClass} onClose={() => setManageStudentsClass(null)} />}

        {/* Edit Class Modal */}
        {editingClass && <EditClassModal class={editingClass} isOpen={!!editingClass} onClose={() => setEditingClass(null)} />}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingClass} onOpenChange={() => setDeletingClass(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar clase?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará la clase programada y todas sus instancias asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingClass) {
                    console.log('🟢 [DELETE] Deleting programmed class:', deletingClass.id);
                    deleteProgrammedClass.mutate(deletingClass.id);
                    setDeletingClass(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>;
}

// Modal para administradores/profesores
function AdminClassDetailsModal({
  class: selectedClass,
  onManageStudents,
  onEditClass
}: {
  class: ScheduledClassWithTemplate;
  onManageStudents?: () => void;
  onEditClass?: () => void;
}) {
  const {
    t
  } = useTranslation();
  const getLevelDisplay = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? `${t('classes.level')} ${cls.level_from}` : `${t('classes.level')} ${cls.level_from}-${cls.level_to}`;
    }
    return t('classes.withoutLevel');
  };
  const getLevelColor = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      if (cls.custom_level.includes('primera')) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.custom_level.includes('segunda')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (cls.custom_level.includes('tercera')) return 'bg-red-100 text-red-800 border-red-200';
    }
    if (cls.level_from) {
      if (cls.level_from <= 3) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.level_from <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  return <DialogContent className="max-w-md w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          {t('classes.classDetails')}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-semibold text-base sm:text-lg truncate">{selectedClass.name}</h3>
          <Badge className={`${getLevelColor(selectedClass)} text-xs`}>
            {getLevelDisplay(selectedClass)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <div className="text-muted-foreground">{t('classes.schedule')}</div>
            <div className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {selectedClass.start_time.slice(0, 5)}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">{t('classes.duration')}</div>
            <div className="font-medium">
              {selectedClass.duration_minutes} {t('classes.min')}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">{t('classes.students')}</div>
            <div className="font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedClass.participants?.length || 0}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">{t('classes.days')}</div>
            <div className="font-medium">
              {selectedClass.days_of_week.join(', ')}
            </div>
          </div>
        </div>

        <div>
          <div className="text-muted-foreground text-xs sm:text-sm">{t('classes.period')}</div>
          <div className="font-medium text-xs sm:text-sm">
            {format(parseISO(selectedClass.start_date), "dd/MM/yy")} - {format(parseISO(selectedClass.end_date), "dd/MM/yy")}
          </div>
        </div>

        {selectedClass.participants && selectedClass.participants.length > 0 && <div>
            <div className="text-muted-foreground text-xs sm:text-sm mb-2">{t('classes.enrolledStudents')}</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedClass.participants.map(participant => <div key={participant.id} className="text-xs sm:text-sm p-2 bg-muted rounded truncate">
                  {participant.student_enrollment.full_name}
                </div>)}
            </div>
          </div>}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={onEditClass}>
            {t('classes.edit')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={onManageStudents}>
            <span className="hidden sm:inline">{t('classes.manageStudentsAction')}</span>
            <span className="sm:hidden">Gestionar</span>
          </Button>
        </div>
      </div>
    </DialogContent>;
}

// Modal para jugadores
function PlayerClassDetailsModal({
  class: selectedClass
}: {
  class: ScheduledClassWithTemplate;
}) {
  const {
    profile
  } = useAuth();
  const {
    t
  } = useTranslation();
  const enrolledCount = selectedClass.participants?.length || 0;

  // Hooks para lista de espera
  const {
    data: capacity
  } = useClassCapacity(selectedClass.id);
  const {
    data: waitlistPosition
  } = useUserWaitlistPosition(selectedClass.id, profile?.id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const handleJoinWaitlist = () => {
    if (profile?.id) {
      joinWaitlist.mutate({
        classId: selectedClass.id,
        userId: profile.id
      });
    }
  };
  const handleLeaveWaitlist = () => {
    if (profile?.id) {
      leaveWaitlist.mutate({
        classId: selectedClass.id,
        userId: profile.id
      });
    }
  };
  const getLevelDisplay = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? `${t('classes.level')} ${cls.level_from}` : `${t('classes.level')} ${cls.level_from}-${cls.level_to}`;
    }
    return t('classes.withoutLevel');
  };
  const getLevelColor = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      if (cls.custom_level.includes('primera')) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.custom_level.includes('segunda')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (cls.custom_level.includes('tercera')) return 'bg-red-100 text-red-800 border-red-200';
    }
    if (cls.level_from) {
      if (cls.level_from <= 3) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.level_from <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  const getEndTime = () => {
    const [hours, minutes] = selectedClass.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedClass.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  const actualCapacity = {
    current: capacity?.currentParticipants || enrolledCount,
    max: capacity?.maxParticipants || selectedClass.max_participants || 8,
    waitlistCount: capacity?.waitlistCount || 0
  };
  const hasAvailableSpots = actualCapacity.current < actualCapacity.max;
  return <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-base sm:text-lg truncate">Detalles de la Clase</span>
          <Badge className={`${getLevelColor(selectedClass)} text-xs flex-shrink-0`}>
            {getLevelDisplay(selectedClass)}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-2 truncate">{selectedClass.name}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Horario</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedClass.start_time.slice(0, 5)} - {getEndTime()}</span>
                <span className="text-muted-foreground">({selectedClass.duration_minutes} min)</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Días de la semana</div>
              <div className="flex flex-wrap gap-1">
                {selectedClass.days_of_week.map(day => <Badge key={day} variant="outline" className="text-xs">
                    {day}
                  </Badge>)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Periodo</div>
              <div className="text-sm">
                {new Date(selectedClass.start_date).toLocaleDateString('es-ES')} - {new Date(selectedClass.end_date).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Capacidad</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{actualCapacity.current}/{actualCapacity.max} alumnos</span>
                {actualCapacity.waitlistCount > 0 && <Badge variant="secondary" className="text-xs">
                    +{actualCapacity.waitlistCount} en lista de espera
                  </Badge>}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Tipo de recurrencia</div>
              <div className="text-sm font-medium">{selectedClass.recurrence_type}</div>
            </div>
          </div>
        </div>

        {/* Información de disponibilidad y acciones */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div className="text-center">
              {hasAvailableSpots ? <div className="text-sm text-green-600 font-medium mb-2">
                  ¡Plazas disponibles!
                </div> : <div className="text-sm text-amber-600 font-medium mb-2">
                  Clase completa
                </div>}
            </div>
            
            {/* Botones de lista de espera - siempre disponibles */}
            <div className="flex justify-center">
              {waitlistPosition ? <div className="text-center space-y-3 w-full">
                  <Badge variant="outline" className="text-sm">
                    Posición {waitlistPosition.position} en lista de espera
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleLeaveWaitlist} disabled={leaveWaitlist.isPending} className="w-full">
                    <UserMinus className="h-4 w-4 mr-2" />
                    {leaveWaitlist.isPending ? "Saliendo..." : "Salir de lista de espera"}
                  </Button>
                </div> : <Button onClick={handleJoinWaitlist} disabled={joinWaitlist.isPending} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {joinWaitlist.isPending ? "Uniéndose..." : "Reservar en lista de espera"}
                </Button>}
            </div>
            
            {hasAvailableSpots && <div className="text-xs text-center text-muted-foreground">
                También puedes contactar directamente con el club para inscribirte
              </div>}
          </div>
        </div>
      </div>
    </DialogContent>;
}