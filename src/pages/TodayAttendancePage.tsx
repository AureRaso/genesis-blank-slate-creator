import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayAttendance, useTrainerMarkAttendance, useTrainerMarkAbsence, useTrainerClearStatus, useRemoveParticipant, useCancelClass, useCancelledClasses, useDeleteClassSeries } from "@/hooks/useTodayAttendance";
import { useSendWhatsAppNotification } from "@/hooks/useWhatsAppNotification";
import { useSendCancellationNotification } from "@/hooks/useCancellationNotification";
import { useCurrentUserWhatsAppGroup, useAllWhatsAppGroups } from "@/hooks/useWhatsAppGroup";
import { useClassWaitlist } from "@/hooks/useClassWaitlist";
import { usePrivateLessonBookingsForAttendance } from "@/hooks/usePrivateLessons";
import PrivateLessonAttendanceCard from "@/components/private-lessons/PrivateLessonAttendanceCard";
import { getWaitlistUrl } from "@/utils/url";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, XCircle, Clock, Users, Wifi, ChevronDown, ChevronUp, AlertTriangle, RotateCcw, UserPlus, Search, Trash2, MessageSquare, LockOpen, Ban, MoreVertical, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import WaitlistManagement from "@/components/WaitlistManagement";
import SubstituteStudentSearch from "@/components/SubstituteStudentSearch";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import OpenClassesTab from "@/components/OpenClassesTab";
import AssignSecondTrainerDialog from "@/components/AssignSecondTrainerDialog";
import { useParticipantActiveBonos } from "@/hooks/useStudentBonos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Check if absence was notified with less than 5 hours notice
const isLateAbsenceNotice = (participant: any, classStartTime: string, selectedDate: string): { isLate: boolean; hoursNotice: number } => {
  if (!participant.absence_confirmed || !participant.absence_confirmed_at) {
    return { isLate: false, hoursNotice: 0 };
  }

  // Build class start datetime
  const [hours, minutes] = classStartTime.split(':').map(Number);
  const classDateTime = new Date(selectedDate);
  classDateTime.setHours(hours, minutes, 0, 0);

  // Timestamp when absence was confirmed
  const absenceConfirmedTime = new Date(participant.absence_confirmed_at);

  // Calculate difference in hours
  const diffInMs = classDateTime.getTime() - absenceConfirmedTime.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  // If confirmed with less than 5 hours notice and it's in the future
  return {
    isLate: diffInHours < 5 && diffInHours >= 0,
    hoursNotice: diffInHours
  };
};

const TodayAttendancePage = () => {
  const { profile, isAdmin, effectiveClubId, isSuperAdmin, superAdminClubs } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for queries
  const { data: attendanceData, isLoading, error, isFetching } = useTodayAttendance();
  const classes = attendanceData?.classes;
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup, isLoading: loadingWhatsAppGroup } = useCurrentUserWhatsAppGroup();
  // For superadmin with "all clubs" selected, pass all their club IDs
  const superAdminClubIds = isSuperAdmin && !effectiveClubId
    ? superAdminClubs.map(c => c.id)
    : undefined;
  const { data: allWhatsAppGroups, isLoading: loadingAllGroups } = useAllWhatsAppGroups(effectiveClubId, superAdminClubIds);
  const [expandedWaitlist, setExpandedWaitlist] = useState<string | null>(null);
  const [substituteDialog, setSubstituteDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    clubId: string;
  }>({
    open: false,
    classId: '',
    className: '',
    clubId: '',
  });
  const [whatsappGroupDialog, setWhatsappGroupDialog] = useState<{
    open: boolean;
    classData: any | null;
    notificationType?: 'absence' | 'free_spot';
    selectedGroups: string[]; // Array de group_chat_id seleccionados
  }>({
    open: false,
    classData: null,
    notificationType: 'absence',
    selectedGroups: [],
  });

  // Estado para tracking de notificaciones enviadas con cooldown de 10 minutos
  const [notificationCooldowns, setNotificationCooldowns] = useState<Record<string, number>>({});

  // Estado para filtro por entrenador (solo admin)
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');

  // Solo administradores pueden notificar por WhatsApp (isAdmin includes superadmin from AuthContext)
  const isTrainer = profile?.role === 'trainer';
  const canCancelClass = isAdmin || isTrainer;

  // Estados para diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'attendance' | 'absence' | 'clear' | 'remove';
    participantId: string;
    participantName: string;
    scheduledDate?: string;
  }>({
    open: false,
    type: 'attendance',
    participantId: '',
    participantName: '',
  });

  // Hooks para acciones del profesor
  const markAttendance = useTrainerMarkAttendance();
  const markAbsence = useTrainerMarkAbsence();
  const clearStatus = useTrainerClearStatus();
  const removeParticipant = useRemoveParticipant();
  const cancelClass = useCancelClass();
  const deleteClass = useDeleteClassSeries();
  const { data: cancelledClasses = [] } = useCancelledClasses(todayStr, todayStr);
  const sendCancellationNotification = useSendCancellationNotification();

  // Estado para diálogo de cancelación de clase (soporta múltiples)
  const [cancelClassDialog, setCancelClassDialog] = useState<{
    open: boolean;
    selectedClasses: { classId: string; className: string; classTime: string; clubId: string }[];
    classDate: string;
    notifyParticipants: boolean;
    availableClasses: { classId: string; className: string; classTime: string; clubId: string }[];
    reason: string;
    isFinished: boolean;
  }>({
    open: false,
    selectedClasses: [],
    classDate: '',
    notifyParticipants: true,
    availableClasses: [],
    reason: '',
    isFinished: false,
  });

  // Estado para diálogo de eliminación de clase
  const [deleteClassDialog, setDeleteClassDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    classTime: string;
    classDate: string;
    isDeleting: boolean;
  }>({
    open: false,
    classId: '',
    className: '',
    classTime: '',
    classDate: '',
    isDeleting: false,
  });

  // Estado para diálogo de asignar segundo profesor (solo admin/superadmin)
  const [assignTrainerDialog, setAssignTrainerDialog] = useState<{
    open: boolean;
    classData: any | null;
  }>({
    open: false,
    classData: null,
  });

  // Handlers con confirmación
  const handleConfirmAttendance = (participantId: string, participantName: string, scheduledDate: string) => {
    setConfirmDialog({
      open: true,
      type: 'attendance',
      participantId,
      participantName,
      scheduledDate,
    });
  };

  const handleConfirmAbsence = (participantId: string, participantName: string, scheduledDate: string) => {
    setConfirmDialog({
      open: true,
      type: 'absence',
      participantId,
      participantName,
      scheduledDate,
    });
  };

  const handleConfirmClear = (participantId: string, participantName: string) => {
    setConfirmDialog({
      open: true,
      type: 'clear',
      participantId,
      participantName,
    });
  };

  const handleConfirmRemove = (participantId: string, participantName: string) => {
    setConfirmDialog({
      open: true,
      type: 'remove',
      participantId,
      participantName,
    });
  };

  const executeAction = () => {
    if (confirmDialog.type === 'attendance' && confirmDialog.scheduledDate) {
      markAttendance.mutate({
        participantId: confirmDialog.participantId,
        scheduledDate: confirmDialog.scheduledDate,
      });
    } else if (confirmDialog.type === 'absence' && confirmDialog.scheduledDate) {
      markAbsence.mutate({
        participantId: confirmDialog.participantId,
        scheduledDate: confirmDialog.scheduledDate,
        reason: 'Marcado por profesor',
      });
    } else if (confirmDialog.type === 'clear') {
      clearStatus.mutate(confirmDialog.participantId);
    } else if (confirmDialog.type === 'remove') {
      removeParticipant.mutate(confirmDialog.participantId);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Handler para cancelar clase - calcula las clases disponibles de hoy
  const handleCancelClass = (classId: string, className: string, classTime: string, isFinished: boolean = false) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Si es una clase finalizada, solo incluir la clase clickeada
    if (isFinished) {
      const clickedClass = { classId, className, classTime, clubId: (classes || []).find((c: any) => c.id === classId)?.club_id || '' };
      setCancelClassDialog({
        open: true,
        selectedClasses: [clickedClass],
        classDate: today,
        notifyParticipants: false,
        availableClasses: [clickedClass],
        reason: '',
        isFinished: true,
      });
      return;
    }

    // Obtener todas las clases de hoy que aún no hayan empezado y no estén canceladas
    const availableClasses = (classes || [])
      .filter((c: any) => {
        // Verificar que no esté ya cancelada
        if (isClassCancelled(c.id, today)) {
          return false;
        }

        // Verificar que no haya empezado
        const [classHours, classMinutes] = c.start_time.split(':').map(Number);
        const classStartTime = new Date();
        classStartTime.setHours(classHours, classMinutes, 0, 0);
        if (now > classStartTime) {
          return false; // Ya empezó
        }

        return true;
      })
      .map((c: any) => ({
        classId: c.id,
        className: c.name,
        classTime: c.start_time,
        clubId: c.club_id,
      }))
      .sort((a: any, b: any) => a.classTime.localeCompare(b.classTime));

    // La clase clickeada se selecciona por defecto
    const initialSelected = availableClasses.filter(
      (c: any) => c.classId === classId
    );

    setCancelClassDialog({
      open: true,
      selectedClasses: initialSelected,
      classDate: today,
      notifyParticipants: true,
      availableClasses,
      reason: '',
      isFinished: false,
    });
  };

  // Handler para eliminar clase - abre el diálogo de confirmación
  const handleDeleteClass = (classId: string, className: string, classTime: string) => {
    setDeleteClassDialog({
      open: true,
      classId,
      className,
      classTime,
      classDate: todayStr,
      isDeleting: false,
    });
  };

  // Ejecutar eliminación de clase
  const executeDeleteClass = async () => {
    setDeleteClassDialog(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteClass.mutateAsync({ classId: deleteClassDialog.classId });
      setDeleteClassDialog({
        open: false,
        classId: '',
        className: '',
        classTime: '',
        classDate: '',
        isDeleting: false,
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      setDeleteClassDialog(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Toggle selección de una clase en el diálogo
  const toggleClassSelection = (classId: string, className: string, classTime: string, clubId: string) => {
    setCancelClassDialog(prev => {
      const isSelected = prev.selectedClasses.some(c => c.classId === classId);
      if (isSelected) {
        return {
          ...prev,
          selectedClasses: prev.selectedClasses.filter(c => c.classId !== classId),
        };
      } else {
        return {
          ...prev,
          selectedClasses: [...prev.selectedClasses, { classId, className, classTime, clubId }],
        };
      }
    });
  };

  // Seleccionar/deseleccionar todas las clases
  const toggleSelectAll = () => {
    setCancelClassDialog(prev => {
      if (prev.selectedClasses.length === prev.availableClasses.length) {
        return { ...prev, selectedClasses: [] };
      } else {
        return { ...prev, selectedClasses: [...prev.availableClasses] };
      }
    });
  };

  // Ejecutar cancelación de múltiples clases
  const executeCancelClass = async () => {
    const { selectedClasses, classDate, notifyParticipants, reason } = cancelClassDialog;

    if (selectedClasses.length === 0) {
      toast.error('Selecciona al menos una clase para cancelar');
      return;
    }

    // Usar el motivo proporcionado o uno por defecto
    const cancelReason = reason.trim() || 'Cancelada por profesor/admin';

    // Cancelar cada clase seleccionada
    let successCount = 0;
    for (const classItem of selectedClasses) {
      try {
        await new Promise<void>((resolve) => {
          cancelClass.mutate({
            classId: classItem.classId,
            cancelledDate: classDate,
            reason: cancelReason,
          }, {
            onSuccess: () => {
              successCount++;
              // Si está marcado notificar, enviar WhatsApp
              if (notifyParticipants) {
                sendCancellationNotification.mutate({
                  classId: classItem.classId,
                  cancelledDate: classDate,
                  className: classItem.className,
                  classTime: classItem.classTime,
                  reason: cancelReason,
                  clubId: classItem.clubId,
                });
              }
              resolve();
            },
            onError: (error) => {
              console.error('Error cancelling class:', classItem.className, error);
              resolve(); // Continue with next class
            }
          });
        });
      } catch (error) {
        console.error('Error in cancellation:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} clase${successCount > 1 ? 's' : ''} cancelada${successCount > 1 ? 's' : ''}`);
    }

    setCancelClassDialog({
      open: false,
      selectedClasses: [],
      classDate: '',
      notifyParticipants: true,
      availableClasses: [],
      reason: '',
      isFinished: false,
    });
  };

  // Verificar si una clase está cancelada en una fecha específica
  const isClassCancelled = (classId: string, date: string) => {
    return cancelledClasses.some(
      (cancelled) => cancelled.programmed_class_id === classId && cancelled.cancelled_date === date
    );
  };

  const handleNotifyWhatsApp = (classData: any) => {
    console.log('🔔 handleNotifyWhatsApp called');
    console.log('📊 allWhatsAppGroups:', allWhatsAppGroups);
    console.log('📊 allWhatsAppGroups length:', allWhatsAppGroups?.length);
    console.log('📊 whatsappGroup:', whatsappGroup);

    // Verificar si la clase está en cooldown
    if (isInCooldown(classData.id)) {
      const minutesRemaining = getCooldownMinutesRemaining(classData.id);
      toast.error(`⏰ Debes esperar ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''} antes de enviar otra notificación para esta clase`);
      return;
    }

    // Si hay múltiples grupos, mostrar diálogo de selección
    if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
      console.log('✅ Múltiples grupos detectados, mostrando diálogo');
      setWhatsappGroupDialog({
        open: true,
        classData: classData,
        notificationType: 'absence',
        selectedGroups: [],
      });
      return;
    }

    console.log('ℹ️ Un solo grupo o menos, enviando directamente');

    // Si solo hay un grupo en allWhatsAppGroups (filtrado por club), usarlo
    // IMPORTANTE: Usamos allWhatsAppGroups[0] en lugar de whatsappGroup porque
    // allWhatsAppGroups está filtrado por club_id del perfil, mientras que
    // whatsappGroup (useCurrentUserWhatsAppGroup) para admins retorna el primer grupo global
    const targetGroup = allWhatsAppGroups?.[0]?.group_chat_id || whatsappGroup?.group_chat_id;
    if (!targetGroup) {
      console.error("No WhatsApp group configured for this club");
      toast.error("No hay grupo de WhatsApp configurado para este club");
      return;
    }

    sendNotificationToGroup(targetGroup, classData);
  };

  const handleNotifyFreeSpot = (classData: any) => {
    console.log('📢 handleNotifyFreeSpot called');
    console.log('📊 allWhatsAppGroups:', allWhatsAppGroups);
    console.log('📊 allWhatsAppGroups length:', allWhatsAppGroups?.length);
    console.log('📊 whatsappGroup:', whatsappGroup);

    // Verificar si la clase está en cooldown
    if (isInCooldown(classData.id)) {
      const minutesRemaining = getCooldownMinutesRemaining(classData.id);
      toast.error(`⏰ Debes esperar ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''} antes de enviar otra notificación para esta clase`);
      return;
    }

    // Si hay múltiples grupos, mostrar diálogo de selección
    if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
      console.log('✅ Múltiples grupos detectados, mostrando diálogo');
      setWhatsappGroupDialog({
        open: true,
        classData: classData,
        notificationType: 'free_spot',
        selectedGroups: [],
      });
      return;
    }

    console.log('ℹ️ Un solo grupo o menos, enviando directamente');

    // Si solo hay un grupo en allWhatsAppGroups (filtrado por club), usarlo
    // IMPORTANTE: Usamos allWhatsAppGroups[0] en lugar de whatsappGroup porque
    // allWhatsAppGroups está filtrado por club_id del perfil
    const targetGroup = allWhatsAppGroups?.[0]?.group_chat_id || whatsappGroup?.group_chat_id;
    if (!targetGroup) {
      console.error("No WhatsApp group configured for this club");
      toast.error("No hay grupo de WhatsApp configurado para este club");
      return;
    }

    sendFreeSpotNotification(targetGroup, classData);
  };

  const sendNotificationToGroup = (groupChatId: string, classData: any) => {
    const today = new Date().toISOString().split('T')[0];
    const maxParticipants = classData.max_participants || 8;
    const attendingCount = classData.participants.filter((p: any) => p.student_enrollment && !p.absence_confirmed).length;
    const availableSlots = maxParticipants - attendingCount;

    // Generate waitlist URL
    const waitlistUrl = getWaitlistUrl(classData.id, today);

    sendWhatsApp({
      groupChatId: groupChatId,
      className: classData.name,
      classDate: today,
      classTime: classData.start_time,
      trainerName: classData.trainer?.full_name || 'Profesor',
      waitlistUrl,
      availableSlots: availableSlots,
      classId: classData.id,
      language: classData.club_language || 'es'
    });

    // Cerrar el diálogo si estaba abierto
    setWhatsappGroupDialog({ open: false, classData: null, notificationType: 'absence', selectedGroups: [] });
  };

  // Nueva función para enviar a múltiples grupos seleccionados
  const sendNotificationToMultipleGroups = async () => {
    const { selectedGroups, classData, notificationType } = whatsappGroupDialog;

    if (!classData || selectedGroups.length === 0) return;

    // Enviar a cada grupo seleccionado
    for (const groupChatId of selectedGroups) {
      if (notificationType === 'free_spot') {
        sendFreeSpotNotification(groupChatId, classData);
      } else {
        sendNotificationToGroup(groupChatId, classData);
      }

      // Pequeña pausa entre envíos para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Establecer cooldown de 10 minutos para esta clase
    const cooldownEnd = Date.now() + 10 * 60 * 1000; // 10 minutos en milisegundos
    setNotificationCooldowns(prev => ({
      ...prev,
      [classData.id]: cooldownEnd
    }));

    // Cerrar el diálogo
    setWhatsappGroupDialog({
      open: false,
      classData: null,
      notificationType: 'absence',
      selectedGroups: []
    });

    toast.success(`✓ Notificación enviada a ${selectedGroups.length} grupo${selectedGroups.length > 1 ? 's' : ''}`);
  };

  // Función para verificar si una clase está en cooldown
  const isInCooldown = (classId: string): boolean => {
    const cooldownEnd = notificationCooldowns[classId];
    if (!cooldownEnd) return false;
    return Date.now() < cooldownEnd;
  };

  // Función para obtener el tiempo restante de cooldown en minutos
  const getCooldownMinutesRemaining = (classId: string): number => {
    const cooldownEnd = notificationCooldowns[classId];
    if (!cooldownEnd) return 0;
    const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000 / 60);
    return remaining > 0 ? remaining : 0;
  };

  // Toggle de selección de grupo en el diálogo
  const toggleGroupSelection = (groupChatId: string) => {
    setWhatsappGroupDialog(prev => {
      const isSelected = prev.selectedGroups.includes(groupChatId);
      const newSelectedGroups = isSelected
        ? prev.selectedGroups.filter(id => id !== groupChatId)
        : [...prev.selectedGroups, groupChatId];

      return {
        ...prev,
        selectedGroups: newSelectedGroups
      };
    });
  };

  // Seleccionar todos los grupos
  const selectAllGroups = () => {
    if (!allWhatsAppGroups) return;
    const allGroupIds = allWhatsAppGroups.map(g => g.group_chat_id);
    setWhatsappGroupDialog(prev => ({
      ...prev,
      selectedGroups: allGroupIds
    }));
  };

  // Limpiar selección
  const clearGroupSelection = () => {
    setWhatsappGroupDialog(prev => ({
      ...prev,
      selectedGroups: []
    }));
  };

  const sendFreeSpotNotification = (groupChatId: string, classData: any) => {
    const today = new Date().toISOString().split('T')[0];

    // Calculate total available slots
    const maxParticipants = classData.max_participants || 8;
    const validParticipants = classData.participants.filter((p: any) => p.student_enrollment);
    const enrolledCount = validParticipants.length;
    const totalAvailableSlots = maxParticipants - enrolledCount;

    // Generate waitlist URL
    const waitlistUrl = getWaitlistUrl(classData.id, today);

    const params = {
      groupChatId: groupChatId,
      className: classData.name,
      classDate: today,
      classTime: classData.start_time,
      trainerName: classData.trainer?.full_name || 'Profesor',
      waitlistUrl,
      availableSlots: totalAvailableSlots,
      classId: classData.id,
      notificationType: 'free_spot' as const,
      language: classData.club_language || 'es'
    };

    console.log('📤 Sending free spot notification with params:', params);

    sendWhatsApp(params);

    // Cerrar el diálogo si estaba abierto
    setWhatsappGroupDialog({ open: false, classData: null, notificationType: 'absence', selectedGroups: [] });
  };

  const toggleWaitlist = (classId: string) => {
    setExpandedWaitlist(expandedWaitlist === classId ? null : classId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando asistencia de hoy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>No se pudo cargar la asistencia</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const todayString = today.toISOString().split('T')[0];

  // Extraer lista única de entrenadores de las clases (incluyendo trainers secundarios)
  const availableTrainers = useMemo(() => {
    if (!classes) return [];
    const trainerNames: string[] = [];
    classes.forEach(c => {
      if (c.trainer?.full_name) trainerNames.push(c.trainer.full_name);
      if (c.trainer_2?.full_name) trainerNames.push(c.trainer_2.full_name);
    });
    return [...new Set(trainerNames)].sort();
  }, [classes]);

  // Filtrar clases por entrenador seleccionado (busca en trainer y trainer_2)
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (selectedTrainer === 'all') return classes;
    return classes.filter(c =>
      c.trainer?.full_name === selectedTrainer ||
      c.trainer_2?.full_name === selectedTrainer
    );
  }, [classes, selectedTrainer]);

  // Collect unique student_enrollment_ids for bono lookup
  const allEnrollmentIds = useMemo(() => {
    const ids = new Set<string>();
    filteredClasses.forEach(c => c.participants.forEach(p => {
      if (p.student_enrollment_id) ids.add(p.student_enrollment_id);
    }));
    return Array.from(ids);
  }, [filteredClasses]);
  const { data: bonoMap } = useParticipantActiveBonos(allEnrollmentIds);

  // Private lesson bookings for today
  const { data: allPrivateLessonBookings = [] } = usePrivateLessonBookingsForAttendance(
    todayStr,
    todayStr,
    undefined,
    effectiveClubId,
    superAdminClubIds
  );
  const filteredPrivateLessons = useMemo(() => {
    if (selectedTrainer === 'all') return allPrivateLessonBookings;
    return allPrivateLessonBookings.filter(b => b.trainer?.full_name === selectedTrainer);
  }, [allPrivateLessonBookings, selectedTrainer]);

  // Calculate statistics (usando clases filtradas)
  const totalClasses = filteredClasses.length;
  const totalParticipants = filteredClasses.reduce((acc, c) => acc + c.participants.length, 0);
  const confirmedParticipants = filteredClasses.reduce(
    (acc, c) => acc + c.participants.filter(p => p.attendance_confirmed_for_date).length,
    0
  );
  const absentParticipants = filteredClasses.reduce(
    (acc, c) => acc + c.participants.filter(p => p.absence_confirmed).length,
    0
  );

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            Gestión de Clases
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Filtro por entrenador - Solo para administradores */}
            {isAdmin && availableTrainers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Filtrar profesor:</span>
                <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                  <SelectTrigger className="w-[130px] sm:w-[180px] h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="Entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableTrainers.map((trainer) => (
                      <SelectItem key={trainer} value={trainer}>
                        {trainer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Live indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              isFetching
                ? 'bg-blue-50 text-blue-700'
                : 'bg-green-50 text-green-700'
            }`}>
              <Wifi className={`h-3 w-3 sm:h-4 sm:w-4 ${isFetching ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium hidden sm:inline">
                {isFetching ? 'Actualizando...' : 'En vivo'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 capitalize truncate">{formattedDate}</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Asistencia Hoy</span>
          </TabsTrigger>
          <TabsTrigger value="open-classes" className="flex items-center gap-2">
            <LockOpen className="h-4 w-4" />
            <span>Clases Abiertas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4 sm:space-y-6 mt-0">{/* Contenido de asistencia */}

      {/* WhatsApp Group Warning - Solo para administradores */}
      {isAdmin && !loadingWhatsAppGroup && !whatsappGroup && (
        <Alert variant="destructive" className="text-xs sm:text-sm">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            No tienes un grupo de WhatsApp configurado. Las notificaciones de disponibilidad no funcionarán hasta que configures un grupo.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Clases Hoy</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground truncate">Clases programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Alumnos</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground truncate">Alumnos esperados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Asistirán</CardTitle>
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {confirmedParticipants}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {totalParticipants > 0
                ? `${Math.round((confirmedParticipants / totalParticipants) * 100)}% confirmado`
                : 'Sin confirmaciones'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">No Asistirán</CardTitle>
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {absentParticipants}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {totalParticipants > 0
                ? `${Math.round((absentParticipants / totalParticipants) * 100)}% ausente`
                : 'Sin ausencias'}
            </p>
          </CardContent>
        </Card>

        {/* Waitlist stats card */}
        {classes && classes.length > 0 && (
          <WaitlistStatsCard classes={classes} todayString={todayString} />
        )}
      </div>

      {/* Classes List */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedTrainer !== 'all' ? 'No hay clases de este entrenador' : 'No hay clases hoy'}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {selectedTrainer !== 'all'
                ? `No hay clases programadas para ${selectedTrainer} hoy`
                : 'No hay clases programadas para hoy en tu club'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClasses.map((classData) => {
            const validParticipants = classData.participants.filter(p => p.student_enrollment);
            // Apply implicit confirmation logic: if no absence is confirmed, consider as confirmed
            const confirmedCount = validParticipants.filter(
              p => {
                const hasExplicitConfirmation = !!p.attendance_confirmed_for_date;
                // Confirmed if either explicit or implicit (not absent)
                return hasExplicitConfirmation || !p.absence_confirmed;
              }
            ).length;
            const maxParticipants = classData.max_participants || 8;
            const confirmationRate = maxParticipants > 0 ? (confirmedCount / maxParticipants) * 100 : 0;
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const isCancelled = isClassCancelled(classData.id, today);
            const [classHrs, classMins] = classData.start_time.split(':').map(Number);
            const classEndTime = new Date();
            classEndTime.setHours(classHrs, classMins + (classData.duration_minutes || 60), 0, 0);
            const hasEnded = now > classEndTime;

            console.log('🔍 Rendering class card:', {
              classId: classData.id,
              className: classData.name,
              isCancelled,
              cancelledClasses: cancelledClasses.length,
              canCancelClass,
              isAdmin,
              isTrainer,
              profileRole: profile?.role
            });

            return (
              <Card key={classData.id} className={isCancelled ? 'opacity-60 border-red-300' : ''}>
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base sm:text-xl truncate">{classData.name}</CardTitle>
                        {isCancelled && (
                          <Badge variant="destructive" className="text-xs">CANCELADA</Badge>
                        )}
                      </div>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{classData.start_time} ({classData.duration_minutes} min)</span>
                        </span>
                        {(classData.trainer || classData.trainer_2) && (
                          <span className="truncate">
                            Profesor: {classData.trainer?.full_name}
                            {classData.trainer_2?.full_name && `, ${classData.trainer_2.full_name}`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={confirmationRate === 100 ? "default" : confirmationRate >= 50 ? "secondary" : "destructive"}
                        className="text-xs self-end sm:self-start"
                      >
                        {confirmedCount}/{maxParticipants}
                      </Badge>
                      {canCancelClass && !isCancelled && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => setAssignTrainerDialog({ open: true, classData })}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Editar clase
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleCancelClass(classData.id, classData.name, classData.start_time, hasEnded)}
                              className="text-amber-600 focus:text-amber-700"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Cancelar clase
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClass(classData.id, classData.name, classData.start_time)}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar clase
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {validParticipants.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      No hay alumnos inscritos en esta clase
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Lista de Alumnos</h4>
                        <Badge variant="outline" className="text-xs font-medium">
                          {validParticipants.length} {validParticipants.length === 1 ? 'alumno' : 'alumnos'}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {validParticipants.map((participant) => {
                          // Apply implicit confirmation logic: if no absence is confirmed, consider as confirmed
                          const hasExplicitConfirmation = !!participant.attendance_confirmed_for_date;
                          const isAbsent = !!participant.absence_confirmed;
                          // Confirmed if either explicit confirmation OR implicit (no absence)
                          const isConfirmed = hasExplicitConfirmation || (!isAbsent);
                          const isPending = false; // No pending state with implicit confirmation
                          const isSubstitute = !!participant.is_substitute;

                          const today = new Date().toISOString().split('T')[0];

                          console.log('👤 DEBUG - Participante:', participant.student_enrollment?.full_name, {
                            isConfirmed,
                            isAbsent,
                            isPending,
                            isSubstitute,
                            is_substitute_field: participant.is_substitute
                          });

                          return (
                            <div
                              key={participant.id}
                              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                participant.is_substitute
                                  ? 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300 shadow-sm hover:shadow-md'
                                  : isConfirmed
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm hover:shadow-md'
                                  : isAbsent
                                  ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 shadow-sm hover:shadow-md'
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                              }`}
                            >
                              {/* Indicator Bar */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                participant.is_substitute ? 'bg-blue-500' : isConfirmed ? 'bg-green-500' : isAbsent ? 'bg-red-500' : 'bg-slate-300'
                              }`} />

                              <div className="p-4 pl-5">
                                {/* Header Row: Info + Actions */}
                                <div className="flex items-start justify-between gap-3">
                                  {/* Student Info */}
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Status Icon */}
                                    <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                      participant.is_substitute
                                        ? (isConfirmed || isAbsent ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-400')
                                        : isConfirmed
                                        ? 'bg-green-100 text-green-600'
                                        : isAbsent
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {isConfirmed ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                      ) : isAbsent ? (
                                        <XCircle className="h-5 w-5" />
                                      ) : (
                                        <Clock className="h-5 w-5" />
                                      )}
                                    </div>

                                    {/* Name and Email */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-semibold text-sm text-slate-900 truncate">
                                          {participant.student_enrollment!.full_name}
                                        </p>
                                        {participant.student_enrollment!.is_ghost && (
                                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                                            Invitado
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        {/* Bono badge */}
                                        {bonoMap?.get(participant.student_enrollment_id) && (() => {
                                          const bono = bonoMap.get(participant.student_enrollment_id)!;
                                          const used = bono.total_classes - bono.remaining_classes;
                                          return (
                                            <p className="text-xs text-slate-900 flex-shrink-0">
                                              🎟 {used}/{bono.total_classes} clases usadas
                                            </p>
                                          );
                                        })()}
                                        {participant.is_substitute && (
                                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200 flex-shrink-0">
                                            Sustituto
                                          </Badge>
                                        )}
                                        {/* Timestamp - hidden on mobile */}
                                        {(participant.attendance_confirmed_at || participant.absence_confirmed_at) && (
                                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <p className="text-xs text-slate-400">
                                              {participant.attendance_confirmed_at
                                                ? format(new Date(participant.attendance_confirmed_at), 'HH:mm')
                                                : format(new Date(participant.absence_confirmed_at!), 'HH:mm')
                                              }
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Presente Button */}
                                    <Button
                                      size="sm"
                                      onClick={() => handleConfirmAttendance(
                                        participant.id,
                                        participant.student_enrollment!.full_name,
                                        today
                                      )}
                                      disabled={markAttendance.isPending || isConfirmed}
                                      className={`h-9 px-3 gap-1.5 font-medium transition-all ${
                                        isConfirmed
                                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                                          : 'bg-white border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300'
                                      }`}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span className="hidden sm:inline">Presente</span>
                                    </Button>

                                    {/* Ausente Button */}
                                    <Button
                                      size="sm"
                                      onClick={() => handleConfirmAbsence(
                                        participant.id,
                                        participant.student_enrollment!.full_name,
                                        today
                                      )}
                                      disabled={markAbsence.isPending || isAbsent}
                                      className={`h-9 px-3 gap-1.5 font-medium transition-all ${
                                        isAbsent
                                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                          : 'bg-white border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300'
                                      }`}
                                    >
                                      <XCircle className="h-4 w-4" />
                                      <span className="hidden sm:inline">Ausente</span>
                                    </Button>

                                    {/* Reset Button */}
                                    {(isConfirmed || isAbsent) && !participant.is_substitute && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleConfirmClear(
                                          participant.id,
                                          participant.student_enrollment!.full_name
                                        )}
                                        disabled={clearStatus.isPending}
                                        className="h-9 w-9 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                        title="Restablecer"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                    )}

                                    {/* Delete Button - Solo para sustitutos */}
                                    {participant.is_substitute && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleConfirmRemove(
                                          participant.id,
                                          participant.student_enrollment!.full_name
                                        )}
                                        disabled={removeParticipant.isPending}
                                        className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        title="Eliminar sustituto"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Attendance marked by trainer/admin */}
                                {isConfirmed && (isAdmin || isTrainer) && participant.confirmed_by_trainer && (
                                  <div className="mt-3 pt-3 border-t border-green-200/50">
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-green-900 mb-0.5">Asistencia confirmada</p>
                                        <p className="text-xs text-green-700">Marcado como presente por el profesor</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Absence Reason */}
                                {isAbsent && (() => {
                                  const lateNotice = isLateAbsenceNotice(participant, classData.start_time, today);
                                  const hoursNotice = Math.floor(lateNotice.hoursNotice);
                                  const minutesNotice = Math.round((lateNotice.hoursNotice - hoursNotice) * 60);

                                  // Only show if there's a reason OR if it's a late notice
                                  if (!participant.absence_reason && !lateNotice.isLate) {
                                    return null;
                                  }

                                  return (
                                    <div className="mt-3 pt-3 border-t border-red-200/50">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <p className="text-xs font-medium text-red-900">
                                              {participant.absence_reason ? 'Motivo de ausencia' : 'Ausencia confirmada'}
                                            </p>
                                            {lateNotice.isLate && (
                                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 bg-orange-600 hover:bg-orange-700">
                                                ⚠️ Aviso tardío (&lt;5h)
                                              </Badge>
                                            )}
                                          </div>
                                          {participant.absence_reason && (
                                            <p className="text-xs text-red-700">{participant.absence_reason}</p>
                                          )}
                                          {lateNotice.isLate && (
                                            <p className="text-[10px] text-orange-700 mt-1 italic font-medium">
                                              Avisó {hoursNotice > 0 ? `${hoursNotice}h` : ''}{minutesNotice > 0 ? ` ${minutesNotice}min` : ''} antes de la clase
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Substitute Search and WhatsApp Notification */}
                  {(() => {
                    // FIX-2025-12-23: Simplificar cálculo usando confirmedCount (los que VAN a ir)
                    // confirmedCount ya se calcula arriba como: participantes que NO tienen ausencia confirmada
                    // availableSlots = maxParticipants - confirmedCount = plazas realmente libres
                    // Esto soluciona el caso donde hay ausencias DESPUÉS de añadir sustitutos
                    const availableSlots = maxParticipants - confirmedCount;
                    const today = new Date().toISOString().split('T')[0];

                    // Mostrar sección si hay plazas disponibles (confirmedCount < maxParticipants)
                    const showNotificationSection = availableSlots > 0;

                    // Mantener absentCount para el botón de "Notificar ausencia"
                    const absentCount = validParticipants.filter(p => p.absence_confirmed).length;

                    console.log('🔍 DEBUG - Clase:', classData.name, {
                      maxParticipants,
                      confirmedCount,
                      availableSlots,
                      absentCount,
                      showSection: showNotificationSection,
                      participants: validParticipants.map(p => ({
                        name: p.student_enrollment?.full_name,
                        isSubstitute: p.is_substitute,
                        isAbsent: p.absence_confirmed
                      }))
                    });

                    return showNotificationSection && (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-col gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          {/* Badge de plazas disponibles - FIX-2025-12-23 */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                              {availableSlots} {availableSlots === 1 ? 'plaza disponible' : 'plazas disponibles'}
                            </Badge>
                          </div>

                          {/* Botones en columna para mobile, fila para desktop */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {/* Botones WhatsApp y Lista de Espera - Solo para administradores */}
                            {isAdmin && (
                              <>
                                {/* Mostrar "Notificar ausencia" si hay al menos 1 ausencia - FIX-2025-12-23 */}
                                {absentCount > 0 && (() => {
                                  const inCooldown = isInCooldown(classData.id);
                                  const minutesRemaining = getCooldownMinutesRemaining(classData.id);

                                  return (
                                    <Button
                                      size="sm"
                                      onClick={() => handleNotifyWhatsApp(classData)}
                                      disabled={isSendingWhatsApp || !whatsappGroup || inCooldown}
                                      className={`${inCooldown ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-xs sm:text-sm w-full sm:flex-1 sm:min-w-[140px]`}
                                      title={
                                        inCooldown
                                          ? `Espera ${minutesRemaining} min antes de enviar otra notificación`
                                          : !whatsappGroup
                                          ? "No hay grupo de WhatsApp configurado"
                                          : "Enviar notificación al grupo"
                                      }
                                    >
                                      {inCooldown ? (
                                        <>
                                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                          Espera {minutesRemaining} min
                                        </>
                                      ) : (
                                        <>
                                          <WhatsAppIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                          Notificar ausencia
                                        </>
                                      )}
                                    </Button>
                                  );
                                })()}

                                {/* Botón "Comunicar hueco libre": Solo si NO hay ausencias - FIX-2025-12-23 */}
                                {absentCount === 0 && (() => {
                                  const inCooldown = isInCooldown(classData.id);
                                  const minutesRemaining = getCooldownMinutesRemaining(classData.id);

                                  return (
                                    <Button
                                      size="sm"
                                      onClick={() => handleNotifyFreeSpot(classData)}
                                      disabled={isSendingWhatsApp || !whatsappGroup || inCooldown}
                                      className={`${inCooldown ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-xs sm:text-sm w-full sm:flex-1 sm:min-w-[140px]`}
                                      title={
                                        inCooldown
                                          ? `Espera ${minutesRemaining} min antes de enviar otra notificación`
                                          : !whatsappGroup
                                          ? "No hay grupo de WhatsApp configurado"
                                          : "Comunicar hueco libre al grupo"
                                      }
                                    >
                                      {inCooldown ? (
                                        <>
                                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                          Espera {minutesRemaining} min
                                        </>
                                      ) : (
                                        <>
                                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                          Comunicar hueco libre
                                        </>
                                      )}
                                    </Button>
                                  );
                                })()}

                                <WaitlistButton
                                  classId={classData.id}
                                  today={today}
                                  isExpanded={expandedWaitlist === classData.id}
                                  onToggle={() => toggleWaitlist(classData.id)}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Waitlist Management Panel - Solo para administradores */}
                        {isAdmin && expandedWaitlist === classData.id && (
                          <WaitlistManagement
                            classId={classData.id}
                            classDate={today}
                            className={classData.name}
                          />
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Private Lessons Section */}
      {filteredPrivateLessons.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-indigo-700">Clases Particulares</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPrivateLessons.map(booking => (
              <PrivateLessonAttendanceCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Group Selection Dialog */}
      <Dialog open={whatsappGroupDialog.open} onOpenChange={(open) => setWhatsappGroupDialog({ ...whatsappGroupDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar grupos de WhatsApp</DialogTitle>
            <DialogDescription>
              Elige uno o varios grupos para enviar la notificación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingAllGroups ? (
              <div className="text-center py-8 text-slate-500">Cargando grupos...</div>
            ) : allWhatsAppGroups && allWhatsAppGroups.length > 0 ? (
              <>
                {/* Botones de selección rápida */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllGroups}
                    className="flex-1"
                  >
                    Seleccionar todos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearGroupSelection}
                    className="flex-1"
                  >
                    Limpiar
                  </Button>
                </div>

                {/* Lista de grupos con checkboxes */}
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                  {allWhatsAppGroups.map((group) => {
                    const isSelected = whatsappGroupDialog.selectedGroups.includes(group.group_chat_id);
                    return (
                      <label
                        key={group.id}
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGroupSelection(group.group_chat_id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="flex-1 font-medium text-sm">{group.group_name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Resumen y botón de envío */}
                <div className="space-y-3 pt-2">
                  {whatsappGroupDialog.selectedGroups.length > 0 && (
                    <div className="text-sm text-center text-muted-foreground">
                      Se enviará a {whatsappGroupDialog.selectedGroups.length} grupo{whatsappGroupDialog.selectedGroups.length > 1 ? 's' : ''}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setWhatsappGroupDialog({
                        open: false,
                        classData: null,
                        notificationType: 'absence',
                        selectedGroups: []
                      })}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={sendNotificationToMultipleGroups}
                      disabled={isSendingWhatsApp || whatsappGroupDialog.selectedGroups.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSendingWhatsApp ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar notificación
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">No hay grupos disponibles</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Substitute Search Dialog */}
      <Dialog open={substituteDialog.open} onOpenChange={(open) => setSubstituteDialog({ ...substituteDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buscar Sustituto</DialogTitle>
            <DialogDescription>
              Busca y añade un alumno sustituto para la clase <strong>{substituteDialog.className}</strong>
            </DialogDescription>
          </DialogHeader>
          {substituteDialog.clubId && (
            <SubstituteStudentSearch
              classId={substituteDialog.classId}
              clubId={substituteDialog.clubId}
              onSuccess={() => setSubstituteDialog({ open: false, classId: '', className: '', clubId: '' })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'attendance' && '¿Marcar como presente?'}
              {confirmDialog.type === 'absence' && '¿Marcar como ausente?'}
              {confirmDialog.type === 'clear' && '¿Restablecer estado?'}
              {confirmDialog.type === 'remove' && '¿Eliminar alumno de la clase?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'attendance' && (
                <>
                  Vas a confirmar la asistencia de <strong>{confirmDialog.participantName}</strong> para esta clase.
                  <br /><br />
                  El alumno verá este cambio reflejado inmediatamente en su dashboard.
                </>
              )}
              {confirmDialog.type === 'absence' && (
                <>
                  Vas a marcar a <strong>{confirmDialog.participantName}</strong> como ausente.
                  <br /><br />
                  Esta acción se reflejará en el dashboard del alumno y en las estadísticas de asistencia.
                </>
              )}
              {confirmDialog.type === 'clear' && (
                <>
                  Vas a restablecer el estado de <strong>{confirmDialog.participantName}</strong> a pendiente.
                  <br /><br />
                  Esto eliminará la confirmación de asistencia o ausencia actual.
                </>
              )}
              {confirmDialog.type === 'remove' && (
                <>
                  Vas a eliminar a <strong>{confirmDialog.participantName}</strong> de esta clase.
                  <br /><br />
                  Esta acción es permanente y liberará la plaza para otros alumnos.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={
                confirmDialog.type === 'attendance'
                  ? 'bg-green-600 hover:bg-green-700'
                  : confirmDialog.type === 'absence' || confirmDialog.type === 'remove'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Class Dialog - Multiple Selection */}
      <AlertDialog open={cancelClassDialog.open} onOpenChange={(open) => setCancelClassDialog({ ...cancelClassDialog, open })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar clases?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Selecciona las clases a cancelar para hoy.
                </p>

                {/* Lista de clases disponibles */}
                {cancelClassDialog.availableClasses.length > 0 ? (
                  <div className="space-y-2">
                    {/* Seleccionar todas */}
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-classes-today"
                        checked={cancelClassDialog.selectedClasses.length === cancelClassDialog.availableClasses.length && cancelClassDialog.availableClasses.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <Label htmlFor="select-all-classes-today" className="text-sm font-semibold cursor-pointer">
                        Seleccionar todas ({cancelClassDialog.availableClasses.length})
                      </Label>
                    </div>

                    {/* Lista de clases */}
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {cancelClassDialog.availableClasses.map((classItem) => (
                        <div
                          key={classItem.classId}
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`class-today-${classItem.classId}`}
                            checked={cancelClassDialog.selectedClasses.some(c => c.classId === classItem.classId)}
                            onCheckedChange={() => toggleClassSelection(classItem.classId, classItem.className, classItem.classTime, classItem.clubId)}
                          />
                          <Label htmlFor={`class-today-${classItem.classId}`} className="text-sm cursor-pointer flex-1 text-left">
                            <span className="font-medium">{classItem.classTime.substring(0, 5)}</span>
                            <span className="mx-1">-</span>
                            <span>{classItem.className}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay clases disponibles para cancelar.</p>
                )}

                {/* Contador de seleccionadas */}
                {cancelClassDialog.selectedClasses.length > 0 && (
                  <p className="text-sm text-blue-600 font-medium">
                    {cancelClassDialog.selectedClasses.length} clase{cancelClassDialog.selectedClasses.length > 1 ? 's' : ''} seleccionada{cancelClassDialog.selectedClasses.length > 1 ? 's' : ''}
                  </p>
                )}

                {/* Motivo de cancelación */}
                <div className="space-y-1.5">
                  <Label htmlFor="cancel-reason-today" className="text-sm font-medium">
                    Motivo (opcional)
                  </Label>
                  <Input
                    id="cancel-reason-today"
                    placeholder="Ej: Lluvia, profesor enfermo..."
                    value={cancelClassDialog.reason}
                    onChange={(e) => setCancelClassDialog({ ...cancelClassDialog, reason: e.target.value })}
                    className="h-9"
                  />
                </div>

                {/* Opción de notificar (oculta para clases finalizadas) */}
                {!cancelClassDialog.isFinished && (
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Checkbox
                      id="notify-participants"
                      checked={cancelClassDialog.notifyParticipants}
                      onCheckedChange={(checked) =>
                        setCancelClassDialog({ ...cancelClassDialog, notifyParticipants: checked === true })
                      }
                    />
                    <Label htmlFor="notify-participants" className="text-sm font-medium cursor-pointer">
                      Notificar a los alumnos por WhatsApp
                    </Label>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCancelClass}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelClass.isPending || sendCancellationNotification.isPending || cancelClassDialog.selectedClasses.length === 0}
            >
              {cancelClass.isPending || sendCancellationNotification.isPending
                ? 'Cancelando...'
                : `Confirmar (${cancelClassDialog.selectedClasses.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Class Dialog */}
      <AlertDialog open={deleteClassDialog.open} onOpenChange={(open) => setDeleteClassDialog({ ...deleteClassDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar clase permanentemente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Estás a punto de eliminar la clase <strong>{deleteClassDialog.className}</strong> ({deleteClassDialog.classTime?.substring(0, 5)}).
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 font-medium">⚠️ Esta acción es irreversible</p>
                  <p className="text-sm text-red-700 mt-1">
                    Se eliminarán todos los registros de asistencia, participantes y la clase programada permanentemente.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteClassDialog.isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteClass}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteClassDialog.isDeleting}
            >
              {deleteClassDialog.isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para asignar segundo profesor (solo admin) */}
      <AssignSecondTrainerDialog
        open={assignTrainerDialog.open}
        onOpenChange={(open) => setAssignTrainerDialog({ ...assignTrainerDialog, open })}
        classData={assignTrainerDialog.classData}
      />
        </TabsContent>

        {/* Tab de Clases Abiertas */}
        <TabsContent value="open-classes" className="mt-0">
          <OpenClassesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component to calculate total waitlist count across all classes
const WaitlistStatsCard = ({ classes, todayString }: { classes: any[], todayString: string }) => {
  // Fetch waitlist data for all classes
  const waitlistQueries = classes.map(classData =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useClassWaitlist(classData.id, todayString)
  );

  // Calculate total pending waitlist entries
  const totalPendingWaitlist = waitlistQueries.reduce((total, query) => {
    const pendingCount = query.data?.filter(w => w.status === 'pending').length || 0;
    return total + pendingCount;
  }, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium">Lista de Espera</CardTitle>
        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="text-xl sm:text-2xl font-bold text-blue-600">
          {totalPendingWaitlist}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {totalPendingWaitlist === 0
            ? 'Sin solicitudes'
            : totalPendingWaitlist === 1
            ? '1 solicitud pendiente'
            : `${totalPendingWaitlist} solicitudes pendientes`}
        </p>
      </CardContent>
    </Card>
  );
};

// Componente auxiliar para el botón de lista de espera con contador
const WaitlistButton = ({
  classId,
  today,
  isExpanded,
  onToggle
}: {
  classId: string;
  today: string;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { data: waitlistData } = useClassWaitlist(classId, today);
  const pendingCount = waitlistData?.filter(w => w.status === 'pending').length || 0;

  console.log('🔍 [WaitlistButton] Debug:', {
    classId,
    today,
    waitlistData,
    pendingCount,
    hasData: !!waitlistData,
    dataLength: waitlistData?.length
  });

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onToggle}
      className="text-xs sm:text-sm w-full sm:flex-1 sm:min-w-[140px] relative"
    >
      {isExpanded ? (
        <>
          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Ocultar
        </>
      ) : (
        <>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Lista de espera {pendingCount > 0 && `(${pendingCount})`}
        </>
      )}
    </Button>
  );
};

export default TodayAttendancePage;
