import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTodayAttendance, useTrainerMarkAttendance, useTrainerMarkAbsence, useTrainerClearStatus, useRemoveParticipant, useCancelClass, useCancelledClasses, useDeleteClassSeries } from "@/hooks/useTodayAttendance";
import { useSendWhatsAppNotification } from "@/hooks/useWhatsAppNotification";
import { useSendCancellationNotification } from "@/hooks/useCancellationNotification";
import { useCurrentUserWhatsAppGroup, useAllWhatsAppGroups } from "@/hooks/useWhatsAppGroup";
import { useBulkEnrollToRecurringClass } from "@/hooks/useClassParticipants";
import { useClassWaitlist } from "@/hooks/useClassWaitlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getWaitlistUrl } from "@/utils/url";
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
import { Calendar, CheckCircle2, XCircle, Clock, Users, Wifi, ChevronDown, ChevronUp, AlertTriangle, UserPlus, Trash2, MessageSquare, LockOpen, ChevronLeft, ChevronRight, Ban, UserMinus, MoreVertical, Settings, Ghost } from "lucide-react";
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
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { es } from "date-fns/locale";
import WaitlistManagement from "@/components/WaitlistManagement";
import SubstituteStudentSearch from "@/components/SubstituteStudentSearch";
import BulkEnrollStudentSearch from "@/components/BulkEnrollStudentSearch";
import { RemoveStudentsDialog } from "@/components/RemoveStudentsDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import OpenClassesTab from "@/components/OpenClassesTab";
import AssignSecondTrainerDialog from "@/components/AssignSecondTrainerDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Get day of week in Spanish format used in database
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

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

const WeekAttendancePage = () => {
  const { profile, isAdmin, effectiveClubId, isSuperAdmin, superAdminClubs } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday
  // Por defecto, seleccionar el día actual
  const [selectedDate, setSelectedDate] = useState<string | null>(() => format(new Date(), 'yyyy-MM-dd'));

  // Calculate week range
  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Sunday

  // Format dates for API
  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');

  // Fetch classes for the entire week
  const { data: attendanceData, isLoading, error, isFetching } = useTodayAttendance(startDateStr, endDateStr);
  const classes = attendanceData?.classes || [];
  const confirmationsMap = attendanceData?.confirmationsMap || new Map();
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
    selectedDate: string;
    clubId: string;
  }>({
    open: false,
    classId: '',
    className: '',
    selectedDate: '',
    clubId: '',
  });
  const [bulkEnrollDialog, setBulkEnrollDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    classStartTime: string;
    clubId: string;
  }>({
    open: false,
    classId: '',
    className: '',
    classStartTime: '',
    clubId: '',
  });
  const [removeStudentsDialog, setRemoveStudentsDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    clubId: string;
    classStartTime: string;
  }>({
    open: false,
    classId: '',
    className: '',
    clubId: '',
    classStartTime: '',
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
    type: 'attendance' | 'absence' | 'remove';
    participantId: string;
    participantName: string;
    scheduledDate?: string;
  }>({
    open: false,
    type: 'attendance',
    participantId: '',
    participantName: '',
  });

  // Estado para diálogo de cancelación de clase (soporta múltiples)
  const [cancelClassDialog, setCancelClassDialog] = useState<{
    open: boolean;
    selectedClasses: { classId: string; className: string; classTime: string; clubId: string }[];
    classDate: string;
    notifyParticipants: boolean;
    availableClasses: { classId: string; className: string; classTime: string; clubId: string }[];
    reason: string;
  }>({
    open: false,
    selectedClasses: [],
    classDate: '',
    notifyParticipants: true,
    availableClasses: [],
    reason: '',
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

  // Hooks para acciones del profesor
  const markAttendance = useTrainerMarkAttendance();
  const markAbsence = useTrainerMarkAbsence();
  const clearStatus = useTrainerClearStatus();
  const removeParticipant = useRemoveParticipant();
  const cancelClass = useCancelClass();
  const deleteClass = useDeleteClassSeries();
  const { data: cancelledClasses = [] } = useCancelledClasses(startDateStr, endDateStr);
  const sendCancellationNotification = useSendCancellationNotification();

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
    setSelectedDate(null); // Reset selected date when changing weeks
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
    setSelectedDate(null); // Reset selected date when changing weeks
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedDate(format(new Date(), 'yyyy-MM-dd')); // Seleccionar día actual
  };

  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });

  // Generate days of the week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }, [weekStart]);

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

  // Filter classes by selected date AND selected trainer
  const filteredClasses = useMemo(() => {
    if (!classes) return [];

    let result = classes;

    // Filtrar por día seleccionado
    if (selectedDate) {
      // Parsear fecha manualmente para evitar problemas de zona horaria
      // new Date("yyyy-MM-dd") interpreta como UTC, causando día incorrecto en zonas negativas
      const [year, month, day] = selectedDate.split('-').map(Number);
      const selectedDayName = getDayOfWeekInSpanish(new Date(year, month - 1, day));
      result = result.filter(cls => cls.days_of_week?.includes(selectedDayName));
    }

    // Filtrar por entrenador seleccionado (busca en trainer y trainer_2)
    if (selectedTrainer !== 'all') {
      result = result.filter(cls =>
        cls.trainer?.full_name === selectedTrainer ||
        cls.trainer_2?.full_name === selectedTrainer
      );
    }

    return result;
  }, [classes, selectedDate, selectedTrainer]);

  // Sort classes: upcoming/current first, past classes last
  const sortedClasses = useMemo(() => {
    if (!filteredClasses || filteredClasses.length === 0) return filteredClasses;

    const now = new Date();
    const currentDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

    return [...filteredClasses].sort((a, b) => {
      // Parse class times
      const [aHours, aMinutes] = a.start_time.split(':').map(Number);
      const [bHours, bMinutes] = b.start_time.split(':').map(Number);

      // Create Date objects for class end times
      const aEndTime = new Date(currentDate);
      aEndTime.setHours(aHours, aMinutes + (a.duration_minutes || 60), 0, 0);

      const bEndTime = new Date(currentDate);
      bEndTime.setHours(bHours, bMinutes + (b.duration_minutes || 60), 0, 0);

      // Check if classes have ended
      const aHasEnded = now > aEndTime;
      const bHasEnded = now > bEndTime;

      // If one has ended and the other hasn't, prioritize the one that hasn't ended
      if (aHasEnded && !bHasEnded) return 1;  // a goes to bottom
      if (!aHasEnded && bHasEnded) return -1; // b goes to bottom

      // If both have the same status (both ended or both not ended), sort by start time
      const aTime = aHours * 60 + aMinutes;
      const bTime = bHours * 60 + bMinutes;
      return aTime - bTime;
    });
  }, [filteredClasses, selectedDate]);

  // Calculate statistics for the filtered classes
  const statistics = useMemo(() => {
    const classesToCount = filteredClasses || [];
    const totalClasses = classesToCount.length;
    const totalParticipants = classesToCount.reduce((acc, c) => acc + c.participants.length, 0);
    // Apply implicit confirmation logic: if no absence is confirmed, consider as confirmed
    const confirmedParticipants = classesToCount.reduce(
      (acc, c) => acc + c.participants.filter(p => {
        const hasExplicitConfirmation = !!p.attendance_confirmed_for_date;
        // Confirmed if either explicit or implicit (not absent)
        return hasExplicitConfirmation || !p.absence_confirmed;
      }).length,
      0
    );
    const absentParticipants = classesToCount.reduce(
      (acc, c) => acc + c.participants.filter(p => p.absence_confirmed).length,
      0
    );

    return {
      totalClasses,
      totalParticipants,
      confirmedParticipants,
      absentParticipants,
    };
  }, [filteredClasses]);

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

  const handleConfirmRemove = (participantId: string, participantName: string) => {
    setConfirmDialog({
      open: true,
      type: 'remove',
      participantId,
      participantName,
    });
  };

  // Handler para cancelar clase - ahora calcula las clases disponibles del mismo día
  const handleCancelClass = (classId: string, className: string, classDate: string, classTime: string) => {
    const now = new Date();
    const targetDayName = getDayOfWeekInSpanish(new Date(classDate + 'T00:00:00'));

    // Obtener todas las clases del mismo día que aún no hayan empezado y no estén canceladas
    const availableClasses = (classes || [])
      .filter((c: any) => {
        // Verificar que la clase tiene el día de la semana correspondiente
        const classDays = c.days_of_week || [];
        if (!classDays.some((d: string) => d.toLowerCase().replace(/[áéíóúü]/g, (m: string) =>
          ({ 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' }[m] || m)
        ) === targetDayName.toLowerCase())) {
          return false;
        }

        // Verificar que no esté ya cancelada
        if (isClassCancelled(c.id, classDate)) {
          return false;
        }

        // Verificar que no haya terminado (solo para el día actual)
        const today = format(now, 'yyyy-MM-dd');
        if (classDate === today) {
          const [classHours, classMinutes] = c.start_time.split(':').map(Number);
          const classStartTime = new Date();
          classStartTime.setHours(classHours, classMinutes, 0, 0);
          if (now > classStartTime) {
            return false; // Ya empezó
          }
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
      classDate,
      notifyParticipants: true,
      availableClasses,
      reason: '',
    });
  };

  // Handler para eliminar clase - abre el diálogo de confirmación
  const handleDeleteClass = (classId: string, className: string, classTime: string, classDate: string) => {
    setDeleteClassDialog({
      open: true,
      classId,
      className,
      classTime,
      classDate,
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
      reason: ''
    });
  };

  // Verificar si una clase está cancelada en una fecha específica
  const isClassCancelled = (classId: string, date: string) => {
    return cancelledClasses.some(
      (cancelled) => cancelled.programmed_class_id === classId && cancelled.cancelled_date === date
    );
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
    } else if (confirmDialog.type === 'remove') {
      removeParticipant.mutate(confirmDialog.participantId);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
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

  const handleNotifyWhatsApp = (classData: any, dateForNotification: string) => {
    // Verificar si la clase está en cooldown
    if (isInCooldown(classData.id)) {
      const minutesRemaining = getCooldownMinutesRemaining(classData.id);
      toast.error(`⏰ Debes esperar ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''} antes de enviar otra notificación para esta clase`);
      return;
    }

    // Si hay múltiples grupos, mostrar diálogo de selección
    if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
      setWhatsappGroupDialog({
        open: true,
        classData: { ...classData, notificationDate: dateForNotification },
        notificationType: 'absence',
        selectedGroups: [],
      });
      return;
    }

    // Si solo hay un grupo en allWhatsAppGroups (filtrado por club), usarlo
    // IMPORTANTE: Usamos allWhatsAppGroups[0] en lugar de whatsappGroup porque
    // allWhatsAppGroups está filtrado por club_id del perfil
    const targetGroup = allWhatsAppGroups?.[0]?.group_chat_id || whatsappGroup?.group_chat_id;
    if (!targetGroup) {
      toast.error("No hay grupo de WhatsApp configurado para este club");
      return;
    }

    sendNotificationToGroup(targetGroup, classData, dateForNotification);
  };

  const handleNotifyFreeSpot = (classData: any, dateForNotification: string) => {
    // Verificar si la clase está en cooldown
    if (isInCooldown(classData.id)) {
      const minutesRemaining = getCooldownMinutesRemaining(classData.id);
      toast.error(`⏰ Debes esperar ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''} antes de enviar otra notificación para esta clase`);
      return;
    }

    // Si hay múltiples grupos, mostrar diálogo de selección
    if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
      setWhatsappGroupDialog({
        open: true,
        classData: { ...classData, notificationDate: dateForNotification },
        notificationType: 'free_spot',
        selectedGroups: [],
      });
      return;
    }

    // Si solo hay un grupo en allWhatsAppGroups (filtrado por club), usarlo
    // IMPORTANTE: Usamos allWhatsAppGroups[0] en lugar de whatsappGroup porque
    // allWhatsAppGroups está filtrado por club_id del perfil
    const targetGroup = allWhatsAppGroups?.[0]?.group_chat_id || whatsappGroup?.group_chat_id;
    if (!targetGroup) {
      toast.error("No hay grupo de WhatsApp configurado para este club");
      return;
    }

    sendFreeSpotNotification(targetGroup, classData, dateForNotification);
  };

  const sendNotificationToGroup = (groupChatId: string, classData: any, dateForNotification: string) => {
    const absentCount = classData.participants.filter((p: any) => p.absence_confirmed).length;
    const substituteCount = classData.participants.filter((p: any) => p.is_substitute).length;
    const availableSlots = absentCount - substituteCount;

    // Generate waitlist URL
    const waitlistUrl = getWaitlistUrl(classData.id, dateForNotification);

    sendWhatsApp({
      groupChatId: groupChatId,
      className: classData.name,
      classDate: dateForNotification,
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

  const sendFreeSpotNotification = (groupChatId: string, classData: any, dateForNotification: string) => {
    // Calculate total available slots
    const maxParticipants = classData.max_participants || 8;
    const validParticipants = classData.participants.filter((p: any) => p.student_enrollment);
    const enrolledCount = validParticipants.length;
    const totalAvailableSlots = maxParticipants - enrolledCount;

    // Generate waitlist URL
    const waitlistUrl = getWaitlistUrl(classData.id, dateForNotification);

    sendWhatsApp({
      groupChatId: groupChatId,
      className: classData.name,
      classDate: dateForNotification,
      classTime: classData.start_time,
      trainerName: classData.trainer?.full_name || 'Profesor',
      waitlistUrl,
      availableSlots: totalAvailableSlots,
      classId: classData.id,
      notificationType: 'free_spot' as const,
      language: classData.club_language || 'es'
    });

    // Cerrar el diálogo si estaba abierto
    setWhatsappGroupDialog({ open: false, classData: null, notificationType: 'absence', selectedGroups: [] });
  };

  // Nueva función para enviar a múltiples grupos seleccionados
  const sendNotificationToMultipleGroups = async () => {
    const { selectedGroups, classData, notificationType } = whatsappGroupDialog;

    if (!classData || selectedGroups.length === 0) return;

    const dateForNotification = classData.notificationDate || format(new Date(), 'yyyy-MM-dd');

    // Enviar a cada grupo seleccionado
    for (const groupChatId of selectedGroups) {
      if (notificationType === 'free_spot') {
        sendFreeSpotNotification(groupChatId, classData, dateForNotification);
      } else {
        sendNotificationToGroup(groupChatId, classData, dateForNotification);
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

  const toggleWaitlist = (classId: string) => {
    setExpandedWaitlist(expandedWaitlist === classId ? null : classId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando asistencia de la semana...</p>
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

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header with Week Navigation */}
      <div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Asistencia
            </h1>
            <div className="flex items-center gap-2">
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

          {/* Week Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>

            <div className="flex flex-col items-center gap-1 flex-1">
              <p className="text-sm font-medium capitalize">
                {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
              </p>
              {!isCurrentWeek && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="text-xs h-6"
                >
                  Ir a esta semana
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Selector */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayName = format(day, 'EEE', { locale: es });
              const dayNumber = format(day, 'd');
              const isSelected = selectedDate === dateStr;
              const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

              // Count classes for this day (respetando el filtro de entrenador, incluyendo trainer_2)
              const dayNameSpanish = getDayOfWeekInSpanish(day);
              const classCount = classes?.filter(cls => {
                const matchesDay = cls.days_of_week?.includes(dayNameSpanish);
                const matchesTrainer = selectedTrainer === 'all' ||
                  cls.trainer?.full_name === selectedTrainer ||
                  cls.trainer_2?.full_name === selectedTrainer;
                return matchesDay && matchesTrainer;
              }).length || 0;

              return (
                <Button
                  key={dateStr}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`flex flex-col items-center p-2 h-auto ${
                    isToday ? 'ring-2 ring-playtomic-orange' : ''
                  } ${isSelected ? 'bg-playtomic-orange hover:bg-playtomic-orange-dark' : ''}`}
                >
                  <span className="text-xs capitalize">{dayName}</span>
                  <span className="text-lg font-bold">{dayNumber}</span>
                  {classCount > 0 && (
                    <Badge variant="secondary" className="mt-1 h-4 px-1 text-[10px]">
                      {classCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {!selectedDate && selectedTrainer === 'all' && (
            <Alert className="bg-purple-50 border-purple-200">
              <Calendar className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                Mostrando <strong>todas las clases de la semana</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  {selectedDate ? 'Clases del día' : 'Clases semana'}
                </CardTitle>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{statistics.totalClasses}</div>
                <p className="text-xs text-muted-foreground truncate">
                  {statistics.totalClasses === 1 ? 'Clase programada' : 'Clases programadas'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Alumnos</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{statistics.totalParticipants}</div>
                <p className="text-xs text-muted-foreground truncate">Alumnos esperado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Asistirán</CardTitle>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {statistics.confirmedParticipants}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {statistics.totalParticipants > 0
                    ? `${Math.round((statistics.confirmedParticipants / statistics.totalParticipants) * 100)}% confirmado`
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
                  {statistics.absentParticipants}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {statistics.totalParticipants > 0
                    ? `${Math.round((statistics.absentParticipants / statistics.totalParticipants) * 100)}% ausente`
                    : 'Sin ausencias'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Asistencia</span>
          </TabsTrigger>
          <TabsTrigger value="open-classes" className="flex items-center gap-2">
            <LockOpen className="h-4 w-4" />
            <span>Clases Abiertas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4 sm:space-y-6 mt-0">
          {/* WhatsApp Group Warning - Para administradores y trainers */}
          {(isAdmin || isTrainer) && !loadingWhatsAppGroup && !whatsappGroup && (
            <Alert variant="destructive" className="text-xs sm:text-sm">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                No tienes un grupo de WhatsApp configurado. Las notificaciones de disponibilidad no funcionarán hasta que configures un grupo.
              </AlertDescription>
            </Alert>
          )}

          {/* Classes List */}
          {!sortedClasses || sortedClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedTrainer !== 'all'
                    ? 'No hay clases de este entrenador'
                    : selectedDate
                    ? 'No hay clases este día'
                    : 'No hay clases esta semana'}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {selectedTrainer !== 'all'
                    ? `No hay clases programadas para ${selectedTrainer}${selectedDate ? ' en este día' : ' esta semana'}`
                    : selectedDate
                    ? 'No hay clases programadas para el día seleccionado'
                    : 'No hay clases programadas para esta semana en tu club'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedClasses.map((classData) => {
                const validParticipants = classData.participants.filter(p => p.student_enrollment);
                
                // Get the notification date - use selected date or calculate the next occurrence of this class
                let notificationDate: string;
                if (selectedDate) {
                  notificationDate = selectedDate;
                } else {
                  // Calculate the next occurrence of this class in the current week
                  // Find the first day of the week that matches this class's days_of_week
                  const classDays = classData.days_of_week || [];
                  const today = new Date();
                  const todayDayName = getDayOfWeekInSpanish(today);
                  
                  // If today matches one of the class days, use today
                  if (classDays.includes(todayDayName)) {
                    notificationDate = format(today, 'yyyy-MM-dd');
                  } else {
                    // Find the next occurrence in the current week
                    let foundDate: Date | null = null;
                    for (let i = 0; i < 7; i++) {
                      const checkDate = new Date(weekStart);
                      checkDate.setDate(checkDate.getDate() + i);
                      const checkDayName = getDayOfWeekInSpanish(checkDate);
                      if (classDays.includes(checkDayName) && checkDate >= today) {
                        foundDate = checkDate;
                        break;
                      }
                    }
                    // If not found in current week, use the first day of the week that matches
                    if (!foundDate) {
                      for (let i = 0; i < 7; i++) {
                        const checkDate = new Date(weekStart);
                        checkDate.setDate(checkDate.getDate() + i);
                        const checkDayName = getDayOfWeekInSpanish(checkDate);
                        if (classDays.includes(checkDayName)) {
                          foundDate = checkDate;
                          break;
                        }
                      }
                    }
                    notificationDate = foundDate ? format(foundDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                  }
                }
                
                // Apply implicit confirmation logic: if no absence is confirmed, consider as confirmed
                const confirmedCount = validParticipants.filter(
                  p => {
                    // Explicit confirmation: has attendance_confirmed_for_date
                    const hasExplicitConfirmation = !!p.attendance_confirmed_for_date;
                    // Implicit confirmation: no absence confirmed
                    // Confirmed if either explicit or implicit (not absent)
                    return hasExplicitConfirmation || !p.absence_confirmed;
                  }
                ).length;
                const maxParticipants = classData.max_participants || 8;
                const confirmationRate = maxParticipants > 0 ? (confirmedCount / maxParticipants) * 100 : 0;

                // Check if class has ended
                const now = new Date();
                const [classHours, classMinutes] = classData.start_time.split(':').map(Number);
                const classEndTime = new Date(notificationDate);
                classEndTime.setHours(classHours, classMinutes + (classData.duration_minutes || 60), 0, 0);
                const hasEnded = now > classEndTime;
                const isCancelled = isClassCancelled(classData.id, notificationDate);

                return (
                  <Card key={`${classData.id}-${notificationDate}`} className={hasEnded ? 'opacity-60 border-gray-300' : isCancelled ? 'opacity-60 border-red-300' : ''}>
                    <CardHeader className="p-3 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base sm:text-xl truncate">{classData.name}</CardTitle>
                            {isCancelled && (
                              <Badge variant="destructive" className="text-xs">CANCELADA</Badge>
                            )}
                            {hasEnded && !isCancelled && (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                                Finalizada
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
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
                            {canCancelClass && !isCancelled && !hasEnded && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 gap-1.5 text-xs w-fit hover:bg-gray-100 hover:text-gray-900"
                                  onClick={() => {
                                    setBulkEnrollDialog({
                                      open: true,
                                      classId: classData.id,
                                      className: classData.name,
                                      classStartTime: classData.start_time,
                                      clubId: classData.club_id,
                                    });
                                  }}
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span>Añadir alumno</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 gap-1.5 text-xs w-fit text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  onClick={() => {
                                    setRemoveStudentsDialog({
                                      open: true,
                                      classId: classData.id,
                                      className: classData.name,
                                      clubId: classData.club_id,
                                      classStartTime: classData.start_time,
                                    });
                                  }}
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                  <span>Eliminar alumno</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {canCancelClass && !isCancelled && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 bg-transparent hover:bg-gray-100 border-0 text-gray-800 p-0 px-2 -mx-2 rounded-md"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isAdmin && (
                                  <DropdownMenuItem
                                    onClick={() => setAssignTrainerDialog({
                                      open: true,
                                      classData: {
                                        id: classData.id,
                                        name: classData.name,
                                        club_id: classData.club_id,
                                        start_time: classData.start_time,
                                        trainer_profile_id: classData.trainer_profile_id,
                                        trainer_profile_id_2: classData.trainer_profile_id_2,
                                        trainer: classData.trainer,
                                        trainer_2: classData.trainer_2,
                                        max_participants: classData.max_participants,
                                      }
                                    })}
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Editar clase
                                  </DropdownMenuItem>
                                )}
                                {!hasEnded && (
                                  <DropdownMenuItem
                                    onClick={() => handleCancelClass(classData.id, classData.name, notificationDate, classData.start_time)}
                                    className="text-amber-600 focus:text-amber-700"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Cancelar clase
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClass(classData.id, classData.name, classData.start_time, notificationDate)}
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
                    <CardContent className="px-3 sm:px-6 pt-2 sm:pt-3 pb-3 sm:pb-6">
                      {validParticipants.length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground italic">
                          No hay alumnos inscritos en esta clase
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-700">Lista de alumnos</h4>
                            <span className="text-xs font-medium text-muted-foreground">
                              {confirmedCount}/{maxParticipants} confirmados
                            </span>
                          </div>
                          <div className="grid gap-3">
                            {validParticipants.map((participant) => {
                              // Get confirmation for this specific date
                              const confirmationKey = `${participant.id}-${notificationDate}`;
                              const confirmation = confirmationsMap.get(confirmationKey);

                              // Use confirmation data if available, otherwise fallback to class_participants data
                              const isAbsent = confirmation
                                ? confirmation.absence_confirmed
                                : (participant.absence_confirmed || false);
                              
                              const hasExplicitConfirmation = confirmation
                                ? confirmation.attendance_confirmed
                                : !!participant.attendance_confirmed_for_date;
                              
                              // Confirmed if either explicit confirmation OR implicit (no absence)
                              const isConfirmed = hasExplicitConfirmation || (!isAbsent);
                              const isPending = false; // No pending state with implicit confirmation
                              const isSubstitute = !!participant.is_substitute;

                              // Get the correct values for display (prefer confirmation over participant)
                              const displayAbsenceReason = confirmation?.absence_reason || participant.absence_reason;
                              const displayAbsenceConfirmedAt = confirmation?.absence_confirmed_at || participant.absence_confirmed_at;
                              const displayAttendanceConfirmedAt = confirmation?.attendance_confirmed_at || participant.attendance_confirmed_at;
                              const displayConfirmedByTrainer = confirmation?.confirmed_by_trainer || participant.confirmed_by_trainer;

                              return (
                                <div
                                  key={participant.id}
                                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                    isAbsent
                                      ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 shadow-sm hover:shadow-md'
                                      : isConfirmed
                                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm hover:shadow-md'
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                  }`}
                                >
                                  {/* Indicator Bar */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                    isAbsent ? 'bg-red-500' : isConfirmed ? 'bg-green-500' : 'bg-slate-300'
                                  }`} />

                                  <div className="p-4 pl-5">
                                    {/* Header Row: Info + Actions */}
                                    <div className="flex items-start justify-between gap-3">
                                      {/* Student Info */}
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* Status Icon */}
                                        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                          isAbsent
                                            ? 'bg-red-100 text-red-600'
                                            : isConfirmed
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-slate-100 text-slate-400'
                                        }`}>
                                          {isAbsent ? (
                                            <XCircle className="h-5 w-5" />
                                          ) : isConfirmed ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                          ) : (
                                            <Clock className="h-5 w-5" />
                                          )}
                                        </div>

                                        {/* Name */}
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-sm text-slate-900 truncate">
                                              {participant.student_enrollment!.full_name}
                                            </p>
                                            {participant.student_enrollment!.is_ghost && (
                                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200 gap-1">
                                                <Ghost className="h-3 w-3" />
                                                Fantasma
                                              </Badge>
                                            )}
                                            {participant.is_substitute && (
                                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                                Sustituto
                                              </Badge>
                                            )}
                                          </div>

                                          {/* Timestamp */}
                                          {(displayAttendanceConfirmedAt || displayAbsenceConfirmedAt) && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <Clock className="h-3 w-3 text-slate-400" />
                                              <p className="text-xs text-slate-400">
                                                {displayAttendanceConfirmedAt
                                                  ? format(new Date(displayAttendanceConfirmedAt), 'HH:mm')
                                                  : format(new Date(displayAbsenceConfirmedAt!), 'HH:mm')
                                                }
                                              </p>
                                            </div>
                                          )}
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
                                            notificationDate
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
                                            notificationDate
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
                                    {isConfirmed && (isAdmin || isTrainer) && displayConfirmedByTrainer && (
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
                                      // Create a participant object with the correct absence data for the late notice calculation
                                      const participantForLateNotice = {
                                        ...participant,
                                        absence_confirmed: true,
                                        absence_confirmed_at: displayAbsenceConfirmedAt,
                                        absence_reason: displayAbsenceReason
                                      };
                                      const lateNotice = isLateAbsenceNotice(participantForLateNotice, classData.start_time, notificationDate);
                                      const hoursNotice = Math.floor(lateNotice.hoursNotice);
                                      const minutesNotice = Math.round((lateNotice.hoursNotice - hoursNotice) * 60);

                                      return (
                                        <div className="mt-3 pt-3 border-t border-red-200/50">
                                          <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <p className="text-xs font-medium text-red-900">
                                                  {displayAbsenceReason ? 'Motivo de ausencia' : 'Ausencia confirmada'}
                                                </p>
                                                {lateNotice.isLate && (
                                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 bg-orange-600 hover:bg-orange-700">
                                                    ⚠️ Aviso tardío (&lt;5h)
                                                  </Badge>
                                                )}
                                              </div>
                                              {displayAbsenceReason && (
                                                <p className="text-xs text-red-700">{displayAbsenceReason}</p>
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

                        // Mostrar sección si hay plazas disponibles (confirmedCount < maxParticipants)
                        const showNotificationSection = availableSlots > 0;

                        // Mantener absentCount para el botón de "Notificar ausencia"
                        const absentCount = validParticipants.filter(p => {
                          const confirmationKey = `${p.id}-${notificationDate}`;
                          const confirmation = confirmationsMap.get(confirmationKey);
                          return confirmation ? confirmation.absence_confirmed : (p.absence_confirmed || false);
                        }).length;

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
                                {/* Botón buscar sustituto - Para todos (admin y trainer) */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSubstituteDialog({
                                    open: true,
                                    classId: classData.id,
                                    className: classData.name,
                                    selectedDate: notificationDate,
                                    clubId: classData.club_id,
                                  })}
                                  className="text-xs sm:text-sm w-full sm:flex-1 sm:min-w-[140px]"
                                >
                                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                  Sustituto
                                </Button>

                                {/* Botones WhatsApp y Lista de Espera - Para administradores y trainers */}
                                {(isAdmin || isTrainer) && (
                                  <>
                                    {/* Mostrar "Notificar ausencia" si hay al menos 1 ausencia - FIX-2025-12-23 */}
                                    {absentCount > 0 && (() => {
                                      const inCooldown = isInCooldown(classData.id);
                                      const minutesRemaining = getCooldownMinutesRemaining(classData.id);

                                      return (
                                        <Button
                                          size="sm"
                                          onClick={() => handleNotifyWhatsApp(classData, notificationDate)}
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
                                          onClick={() => handleNotifyFreeSpot(classData, notificationDate)}
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
                                              Comunicar hueco
                                            </>
                                          )}
                                        </Button>
                                      );
                                    })()}
                                  </>
                                )}
                              </div>

                              {/* Botón Lista de Espera - Debajo de los otros botones */}
                              {(isAdmin || isTrainer) && (
                                <WaitlistButtonWithCount
                                  classId={classData.id}
                                  classDate={notificationDate}
                                  isExpanded={expandedWaitlist === classData.id}
                                  onToggle={() => toggleWaitlist(classData.id)}
                                />
                              )}
                            </div>

                            {/* Waitlist Management Panel - Para administradores y trainers */}
                            {(isAdmin || isTrainer) && expandedWaitlist === classData.id && (
                              <WaitlistManagement
                                classId={classData.id}
                                classDate={notificationDate}
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
                  onSuccess={() => setSubstituteDialog({ open: false, classId: '', className: '', selectedDate: '', clubId: '' })}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Bulk Enroll Student Dialog */}
          <Dialog open={bulkEnrollDialog.open} onOpenChange={(open) => setBulkEnrollDialog({ ...bulkEnrollDialog, open })}>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Añadir Alumno a la Serie Recurrente</DialogTitle>
                <DialogDescription className="text-sm">
                  Busca y añade un alumno a TODAS las clases de la serie <strong>{bulkEnrollDialog.className}</strong>
                </DialogDescription>
              </DialogHeader>
              {bulkEnrollDialog.clubId && (
                <BulkEnrollStudentSearch
                  classId={bulkEnrollDialog.classId}
                  clubId={bulkEnrollDialog.clubId}
                  className={bulkEnrollDialog.className}
                  classStartTime={bulkEnrollDialog.classStartTime}
                  onSuccess={() => setBulkEnrollDialog({ open: false, classId: '', className: '', classStartTime: '', clubId: '' })}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Remove Students Dialog */}
          <RemoveStudentsDialog
            isOpen={removeStudentsDialog.open}
            onClose={() => setRemoveStudentsDialog({
              open: false,
              classId: '',
              className: '',
              clubId: '',
              classStartTime: ''
            })}
            classId={removeStudentsDialog.classId}
            className={removeStudentsDialog.className}
            clubId={removeStudentsDialog.clubId}
            classStartTime={removeStudentsDialog.classStartTime}
          />

          {/* Confirmation Dialog */}
          <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmDialog.type === 'attendance' && '¿Marcar como presente?'}
                  {confirmDialog.type === 'absence' && '¿Marcar como ausente?'}
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
                      Selecciona las clases a cancelar para el {cancelClassDialog.classDate ? format(new Date(cancelClassDialog.classDate + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es }) : ''}.
                    </p>

                    {/* Lista de clases disponibles */}
                    {cancelClassDialog.availableClasses.length > 0 ? (
                      <div className="space-y-2">
                        {/* Seleccionar todas */}
                        <div className="flex items-center space-x-2 pb-2 border-b">
                          <Checkbox
                            id="select-all-classes"
                            checked={cancelClassDialog.selectedClasses.length === cancelClassDialog.availableClasses.length && cancelClassDialog.availableClasses.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                          <Label htmlFor="select-all-classes" className="text-sm font-semibold cursor-pointer">
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
                                id={`class-${classItem.classId}`}
                                checked={cancelClassDialog.selectedClasses.some(c => c.classId === classItem.classId)}
                                onCheckedChange={() => toggleClassSelection(classItem.classId, classItem.className, classItem.classTime, classItem.clubId)}
                              />
                              <Label htmlFor={`class-${classItem.classId}`} className="text-sm cursor-pointer flex-1 text-left">
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
                      <Label htmlFor="cancel-reason" className="text-sm font-medium">
                        Motivo (opcional)
                      </Label>
                      <Input
                        id="cancel-reason"
                        placeholder="Ej: Lluvia, profesor enfermo..."
                        value={cancelClassDialog.reason}
                        onChange={(e) => setCancelClassDialog({ ...cancelClassDialog, reason: e.target.value })}
                        className="h-9"
                      />
                    </div>

                    {/* Opción de notificar */}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Checkbox
                        id="notify-participants-week"
                        checked={cancelClassDialog.notifyParticipants}
                        onCheckedChange={(checked) =>
                          setCancelClassDialog({ ...cancelClassDialog, notifyParticipants: checked === true })
                        }
                      />
                      <Label htmlFor="notify-participants-week" className="text-sm font-medium cursor-pointer">
                        Notificar a los alumnos por WhatsApp
                      </Label>
                    </div>
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

          {/* Assign Second Trainer Dialog - Solo admin/superadmin */}
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

// Componente auxiliar para el botón de lista de espera con contador
const WaitlistButtonWithCount = ({
  classId,
  classDate,
  isExpanded,
  onToggle
}: {
  classId: string;
  classDate: string;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { data: waitlistData } = useClassWaitlist(classId, classDate);
  const pendingCount = waitlistData?.filter(w => w.status === 'pending').length || 0;

  return (
    <Button
      size="default"
      variant="outline"
      onClick={onToggle}
      className="text-sm w-full h-10 font-medium"
    >
      {isExpanded ? (
        <>
          <ChevronUp className="h-4 w-4 mr-2" />
          Ocultar lista de espera
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4 mr-2" />
          Lista de espera {pendingCount > 0 && `(${pendingCount})`}
        </>
      )}
    </Button>
  );
};

export default WeekAttendancePage;
