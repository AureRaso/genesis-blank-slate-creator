import { useState } from "react";
import { Users, Clock, Edit, Settings, UserPlus, UserMinus, Trash2, Pencil, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { EditClassModal } from "./EditClassModal";
import { ManageStudentsModal } from "./ManageStudentsModal";
import { useAuth } from "@/contexts/AuthContext";
import { getTrainerColor, getClassColor } from "@/utils/trainerColors";
import { useClassCapacity, useUserWaitlistPosition, useJoinWaitlist, useLeaveWaitlist } from "@/hooks/useWaitlist";
import { useTranslation } from "react-i18next";
import { useCreateClassPayment } from "@/hooks/useClassPayment";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";
import { useDeleteScheduledClass } from "@/hooks/useScheduledClasses";
import { useClassParticipants } from "@/hooks/useClassParticipants";
import { useStudentClassParticipations } from "@/hooks/useStudentClasses";

interface ClassCardProps {
  class: ScheduledClassWithTemplate;
  onDragStart?: () => void;
  isCompact?: boolean;
  showAsIndicator?: boolean;
  eventCount?: number;
}
export function ClassCard({
  class: cls,
  onDragStart,
  isCompact = false,
  showAsIndicator = false,
  eventCount = 1
}: ClassCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    isAdmin,
    isTrainer,
    profile
  } = useAuth();
  const deleteClassMutation = useDeleteScheduledClass();
  const enrolledCount = cls.participants?.length || 0;
  
  // Get user's class participations to highlight enrolled classes
  const { data: userParticipations = [] } = useStudentClassParticipations();
  const isUserEnrolled = userParticipations.some(participation => 
    participation.programmed_class.id === cls.id && participation.status === 'active'
  );
  const getLevelDisplay = () => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? `Nivel ${cls.level_from}` : `Nivel ${cls.level_from}-${cls.level_to}`;
    }
    return 'Sin nivel';
  };
  const getLevelColor = () => {
    // If user is enrolled in this class, use special enrolled color
    if (isUserEnrolled) {
      return 'bg-primary/20 text-primary border-primary/30 ring-2 ring-primary/20';
    }

    // For admins, use the new class color system that distinguishes creator vs trainer
    if (isAdmin) {
      return getClassColor(cls.created_by, cls.trainer_profile_id, profile?.id || null);
    }

    // For trainers and players, use traditional level colors
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
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + cls.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', cls.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart();
    }
  };
  const handleDeleteClass = () => {
    deleteClassMutation.mutate(cls.id);
    setShowDeleteConfirm(false);
  };

  // For indicator cards, render without dialog to allow dropdown
  if (showAsIndicator) {
    // Extract class number from name (e.g., "Clases Iron 3" -> "3")
    const getShortName = (name: string) => {
      // Check if it's a pattern like "Clases Iron 3" or "Iron 3"
      const ironMatch = name.match(/iron\s*(\d+)/i);
      if (ironMatch) {
        return `Iron ${ironMatch[1]}`;
      }

      // For other names, truncate intelligently
      if (name.length > 15) {
        return name.substring(0, 12) + '...';
      }
      return name;
    };

    return <div className="relative w-full h-full">
        <div className={cn("w-full h-full rounded cursor-pointer hover:opacity-90 transition-all border shadow-sm relative group overflow-hidden", "flex flex-col", "p-0.5 md:p-2 text-[7px] md:text-xs", getLevelColor(), "ring-2 ring-primary/20")} draggable={isAdmin || isTrainer} onDragStart={handleDragStart} onClick={() => console.log('ClassCard indicator clicked:', cls.name)} title={`${cls.name} - ${cls.start_time.slice(0, 5)} - ${getEndTime()} (${cls.duration_minutes} min) - ${enrolledCount} alumnos`}>
          {/* Delete X button - only for admin/trainer */}
          {(isAdmin || isTrainer) && <Button variant="ghost" size="sm" onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setShowDeleteConfirm(true);
        }} className="absolute -top-1 -right-1 h-3 md:h-5 w-3 md:w-5 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <X className="h-2 md:h-3 w-2 md:w-3" />
            </Button>}

          {/* Multiple events indicator */}
          {eventCount > 1 && <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[7px] md:text-xs rounded-full h-3 md:h-5 w-3 md:w-5 flex items-center justify-center font-medium z-20">
              {eventCount}
            </div>}

          {/* Desktop: Full info layout */}
          <div className="hidden md:block flex-1 min-h-0 overflow-hidden">
            <div className="font-medium truncate leading-none text-sm mb-0.5">
              {cls.name}
              {eventCount > 1 && <span className="text-xs opacity-60 ml-1">+{eventCount - 1}</span>}
            </div>
            {cls.club && <div className="text-xs text-muted-foreground truncate font-medium leading-none mb-0.5">
                {cls.club.name}
              </div>}
            <div className="text-xs text-muted-foreground truncate leading-none mb-0.5">
              {getLevelDisplay()}
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{enrolledCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{cls.duration_minutes}min</span>
              </div>
            </div>
          </div>

          {/* Mobile: Compact centered layout */}
          <div className="md:hidden text-center w-full px-0.5 flex-1 flex flex-col justify-center overflow-hidden">
            <div className="font-semibold truncate leading-tight text-[7px] mb-0.5">
              {getShortName(cls.name)}
            </div>
            {cls.duration_minutes >= 60 && (
              <div className="text-[6px] opacity-70 truncate leading-tight">
                {cls.start_time.slice(0, 5)}
              </div>
            )}
            {cls.duration_minutes >= 90 && enrolledCount > 0 && (
              <div className="text-[6px] opacity-60 truncate leading-tight mt-0.5">
                {enrolledCount} alum.
              </div>
            )}
          </div>
        </div>

        <EditClassModal class={cls} isOpen={showEditModal} onClose={() => setShowEditModal(false)} />

        {/* Delete Confirmation AlertDialog for calendar card */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar clase?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la clase "{cls.name}" y todos sus datos asociados. 
                Los alumnos inscritos serán notificados de la cancelación. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteClass} disabled={deleteClassMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleteClassMutation.isPending ? "Eliminando..." : "Sí, cancelar clase"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>;
  }

  // Normal behavior with dialog when not showing as indicator
  // Extract class number from name (e.g., "Clases Iron 3" -> "3")
  const getShortName = (name: string) => {
    // Check if it's a pattern like "Clases Iron 3" or "Iron 3"
    const ironMatch = name.match(/iron\s*(\d+)/i);
    if (ironMatch) {
      return `Iron ${ironMatch[1]}`;
    }

    // For other names, truncate intelligently
    if (name.length > 15) {
      return name.substring(0, 12) + '...';
    }
    return name;
  };

  return <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <div className={cn("w-full h-full rounded cursor-move hover:opacity-90 transition-all border shadow-sm relative group overflow-hidden", "flex flex-col", "p-0.5 md:p-2 text-[7px] md:text-xs", getLevelColor())} draggable={isAdmin || isTrainer} onDragStart={handleDragStart}>
                  {/* Delete X button - only for admin/trainer */}
                  {(isAdmin || isTrainer) && <Button variant="ghost" size="sm" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }} className="absolute -top-1 -right-1 h-3 md:h-5 w-3 md:w-5 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <X className="h-2 md:h-3 w-2 md:w-3" />
                    </Button>}

                  {/* Desktop: Full info layout */}
                  <div className="hidden md:block flex-1 min-h-0 overflow-hidden">
                    <div className="font-medium truncate leading-none text-sm mb-0.5">
                      {cls.name}
                    </div>
                    {cls.club && <div className="text-xs text-muted-foreground truncate font-medium leading-none mb-0.5 my-0">
                        {cls.club.name}
                      </div>}
                    <div className="text-xs text-muted-foreground truncate leading-none mb-0.5 my-[8px]">
                      {getLevelDisplay()}
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{enrolledCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{cls.duration_minutes}min</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Compact centered layout */}
                  <div className="md:hidden text-center w-full px-0.5 flex-1 flex flex-col justify-center overflow-hidden">
                    <div className="font-semibold truncate leading-tight text-[7px] mb-0.5">
                      {getShortName(cls.name)}
                    </div>
                    {cls.duration_minutes >= 60 && (
                      <div className="text-[6px] opacity-70 truncate leading-tight">
                        {cls.start_time.slice(0, 5)}
                      </div>
                    )}
                    {cls.duration_minutes >= 90 && enrolledCount > 0 && (
                      <div className="text-[6px] opacity-60 truncate leading-tight mt-0.5">
                        {enrolledCount} alum.
                      </div>
                    )}
                  </div>
                </div>
              </DialogTrigger>

              {isAdmin || isTrainer ? <AdminClassDetailsModal class={cls} onEditClass={() => {
              setShowDetails(false);
              setShowEditModal(true);
            }} /> : <PlayerClassDetailsModal class={cls} />}
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{cls.name}</div>
              <div className="text-xs">
                {cls.start_time.slice(0, 5)} - {getEndTime()} ({cls.duration_minutes} min)
              </div>
              <div className="text-xs">{enrolledCount} alumnos inscritos</div>
              <div className="text-xs">{getLevelDisplay()}</div>
              {isAdmin && cls.trainer && <div className="text-xs">Profesor: {cls.trainer.full_name}</div>}
              {isAdmin && cls.created_by && <div className="text-xs">Creado por: {cls.created_by === profile?.id ? 'Ti' : 'Otro admin/entrenador'}</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <EditClassModal class={cls} isOpen={showEditModal} onClose={() => setShowEditModal(false)} />

      {/* Delete Confirmation AlertDialog for calendar card */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar clase?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la clase "{cls.name}" y todos sus datos asociados. 
              Los alumnos inscritos serán notificados de la cancelación. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} disabled={deleteClassMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteClassMutation.isPending ? "Eliminando..." : "Sí, cancelar clase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}
interface AdminClassDetailsModalProps {
  class: ScheduledClassWithTemplate;
  onEditClass: () => void;
}
function AdminClassDetailsModal({
  class: cls,
  onEditClass
}: AdminClassDetailsModalProps) {
  const { data: participants = [] } = useClassParticipants(cls.id);
  const enrolledCount = participants.length;
  const {
    isAdmin,
    profile
  } = useAuth();
  const deleteClassMutation = useDeleteScheduledClass();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManageStudents, setShowManageStudents] = useState(false);
  const getLevelDisplay = () => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? `Nivel ${cls.level_from}` : `Nivel ${cls.level_from}-${cls.level_to}`;
    }
    return 'Sin nivel';
  };
  const getLevelColor = () => {
    // For admins, use the new class color system that distinguishes creator vs trainer
    if (isAdmin) {
      return getClassColor(cls.created_by, cls.trainer_profile_id, profile?.id || null);
    }

    // For trainers and players, use traditional level colors
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
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + cls.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  const handleDeleteClass = () => {
    deleteClassMutation.mutate(cls.id);
    setShowDeleteConfirm(false);
  };
  return <DialogContent className="max-w-4xl">
      <DialogHeader className="relative">
        <DialogTitle className="flex items-center justify-between pr-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{cls.name}</h2>
              <p className="text-sm text-muted-foreground">Detalles de la clase</p>
            </div>
          </div>
        </DialogTitle>
        
        {/* Action buttons positioned absolutely */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEditClass} className="h-9 w-9 p-0 rounded-full hover:bg-muted">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="h-9 w-9 p-0 rounded-full hover:bg-destructive/10 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      <div className="mt-6">
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted rounded-lg p-1">
            <TabsTrigger value="information" className="h-10 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">
              <Clock className="h-4 w-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger value="students" className="h-10 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">
              <Users className="h-4 w-4 mr-2" />
              Alumnos ({enrolledCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="information" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Schedule Card */}
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <Clock className="h-4 w-4" />
                  HORARIO
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {cls.start_time.slice(0, 5)} - {getEndTime()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {cls.duration_minutes} minutos de duración
                  </div>
                </div>
              </div>

              {/* Days Card */}
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  DÍAS DE LA SEMANA
                </div>
                <div className="flex flex-wrap gap-2">
                  {cls.days_of_week.map(day => <Badge key={day} variant="secondary" className="text-sm px-3 py-1 capitalize">
                      {day}
                    </Badge>)}
                </div>
              </div>

              {/* Period Card */}
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  PERÍODO
                </div>
                <div className="space-y-1">
                  <div className="font-medium">
                    {new Date(cls.start_date).toLocaleDateString('es-ES')}
                  </div>
                  <div className="text-sm text-muted-foreground">hasta</div>
                  <div className="font-medium">
                    {new Date(cls.end_date).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <Settings className="h-4 w-4" />
                  DETALLES
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nivel</span>
                    <Badge className={cn("text-sm px-3 py-1", getLevelColor())}>
                      {getLevelDisplay()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alumnos</span>
                    <span className="font-medium">{enrolledCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recurrencia</span>
                    <span className="font-medium capitalize">{cls.recurrence_type}</span>
                  </div>
                  {isAdmin && cls.trainer && <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Profesor</span>
                      <span className="font-medium">{cls.trainer.full_name}</span>
                    </div>}
                  {isAdmin && cls.created_by && <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Creado por</span>
                      <span className="font-medium">{cls.created_by === profile?.id ? 'Ti' : 'Otro admin/entrenador'}</span>
                    </div>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <div className="bg-muted/30 rounded-xl p-6">
              {participants && participants.length > 0 ? <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Lista de alumnos</h3>
                    <Badge variant="secondary" className="text-sm">
                      {enrolledCount} estudiantes
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 max-h-80 overflow-y-auto">
                    {participants.map(participant => <div key={participant.id} className="flex items-center justify-between p-4 bg-background rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {participant.student_enrollment?.full_name || 'Alumno sin nombre'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {participant.student_enrollment?.email || 'Sin email'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Nivel: {participant.student_enrollment?.level || 'No especificado'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={participant.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {participant.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>)}
                  </div>
                </div> : <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Sin alumnos inscritos</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Esta clase aún no tiene estudiantes registrados
                  </p>
                  <Button variant="outline" className="gap-2" onClick={() => setShowManageStudents(true)}>
                    <UserPlus className="h-4 w-4" />
                    Añadir primer alumno
                  </Button>
                </div>}
              
              {participants && participants.length > 0 && <div className="pt-6 border-t mt-6">
                  <Button variant="outline" className="gap-2" onClick={() => setShowManageStudents(true)}>
                    <UserPlus className="h-4 w-4" />
                    Añadir Alumno
                  </Button>
                </div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar clase?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la clase "{cls.name}" y todos sus datos asociados. 
              Los alumnos inscritos serán notificados de la cancelación. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} disabled={deleteClassMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteClassMutation.isPending ? "Eliminando..." : "Sí, cancelar clase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Students Modal */}
      <ManageStudentsModal class={cls} isOpen={showManageStudents} onClose={() => setShowManageStudents(false)} />
    </DialogContent>;
}
interface PlayerClassDetailsModalProps {
  class: ScheduledClassWithTemplate;
}
function PlayerClassDetailsModal({
  class: cls
}: PlayerClassDetailsModalProps) {
  const {
    profile
  } = useAuth();
  const {
    t
  } = useTranslation();
  const enrolledCount = cls.participants?.length || 0;

  // Hooks para lista de espera
  const {
    data: capacity
  } = useClassCapacity(cls.id);
  const {
    data: waitlistPosition
  } = useUserWaitlistPosition(cls.id, profile?.id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();

  // Hook para pagos
  const createPayment = useCreateClassPayment();
  const handleJoinWaitlist = () => {
    if (profile?.id) {
      joinWaitlist.mutate({
        classId: cls.id,
        userId: profile.id
      });
    }
  };
  const handleLeaveWaitlist = () => {
    if (profile?.id) {
      leaveWaitlist.mutate({
        classId: cls.id,
        userId: profile.id
      });
    }
  };
  const handleEnrollWithPayment = () => {
    createPayment.mutate({
      classId: cls.id,
      className: cls.name,
      trainerName: cls.trainer?.full_name,
      monthlyPrice: cls.monthly_price
    });
  };
  const getLevelDisplay = () => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? `Nivel ${cls.level_from}` : `Nivel ${cls.level_from}-${cls.level_to}`;
    }
    return 'Sin nivel';
  };
  const getLevelColor = () => {
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
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + cls.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  const actualCapacity = {
    current: capacity?.currentParticipants || enrolledCount,
    max: capacity?.maxParticipants || cls.max_participants || 8,
    waitlistCount: capacity?.waitlistCount || 0
  };
  const hasAvailableSpots = actualCapacity.current < actualCapacity.max;
  return <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Detalles de la Clase</span>
          <Badge className={getLevelColor()}>
            {getLevelDisplay()}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">{cls.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Horario</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{cls.start_time.slice(0, 5)} - {getEndTime()}</span>
                <span className="text-muted-foreground">({cls.duration_minutes} min)</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Días de la semana</div>
              <div className="flex flex-wrap gap-1">
                {cls.days_of_week.map(day => <Badge key={day} variant="outline" className="text-xs">
                    {day}
                  </Badge>)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Periodo</div>
              <div className="text-sm">
                {new Date(cls.start_date).toLocaleDateString('es-ES')} - {new Date(cls.end_date).toLocaleDateString('es-ES')}
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
              <div className="text-sm font-medium">{cls.recurrence_type}</div>
            </div>
          </div>
        </div>

        {/* Información de disponibilidad y acciones */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-amber-600 font-medium mb-2">
                Inscripciones temporalmente pausadas
              </div>
              <p className="text-xs text-muted-foreground">
                Estamos finalizando la configuración del sistema de pagos
              </p>
            </div>

            <div className="flex justify-center">
              {hasAvailableSpots ?
            // Si hay plazas disponibles, mostrar botón deshabilitado
            <div className="space-y-3 w-full">
                  {cls.monthly_price > 0 && <div className="text-center">
                      <div className="text-lg font-semibold text-muted-foreground mb-2">
                        {cls.monthly_price}€/mes
                      </div>
                    </div>}
                  <Button disabled className="w-full bg-muted text-muted-foreground cursor-not-allowed">
                    {cls.monthly_price > 0 ? "Pagar e Inscribirse (En pausa)" : "Inscribirse (En pausa)"}
                  </Button>

                  {/* También mostrar opción de lista de espera como alternativa */}
                  {!waitlistPosition && <Button variant="outline" onClick={handleJoinWaitlist} disabled={joinWaitlist.isPending} className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {joinWaitlist.isPending ? "Uniéndose..." : "Unirse a lista de espera"}
                    </Button>}
                </div> :
            // Si no hay plazas, solo mostrar lista de espera
            waitlistPosition ? <div className="text-center space-y-3 w-full">
                    <Badge variant="outline" className="text-sm">
                      Posición {waitlistPosition.position} en lista de espera
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleLeaveWaitlist} disabled={leaveWaitlist.isPending} className="w-full">
                      <UserMinus className="h-4 w-4 mr-2" />
                      {leaveWaitlist.isPending ? "Saliendo..." : "Salir de lista de espera"}
                    </Button>
                  </div> : <Button onClick={handleJoinWaitlist} disabled={joinWaitlist.isPending} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {joinWaitlist.isPending ? "Uniéndose..." : "Unirse a lista de espera"}
                  </Button>}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>;
}