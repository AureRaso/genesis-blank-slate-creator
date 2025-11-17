import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayAttendance, useTrainerMarkAttendance, useTrainerMarkAbsence, useTrainerClearStatus, useRemoveParticipant, useCancelClass, useCancelledClasses } from "@/hooks/useTodayAttendance";
import { useSendWhatsAppNotification } from "@/hooks/useWhatsAppNotification";
import { useCurrentUserWhatsAppGroup, useAllWhatsAppGroups } from "@/hooks/useWhatsAppGroup";
import { useBulkEnrollToRecurringClass } from "@/hooks/useClassParticipants";
import { useClassWaitlist } from "@/hooks/useClassWaitlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Calendar, CheckCircle2, XCircle, Clock, Users, Wifi, ChevronDown, ChevronUp, AlertTriangle, RotateCcw, UserPlus, Trash2, MessageSquare, LockOpen, ChevronLeft, ChevronRight, Ban, X, UserMinus } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { es } from "date-fns/locale";
import WaitlistManagement from "@/components/WaitlistManagement";
import SubstituteStudentSearch from "@/components/SubstituteStudentSearch";
import BulkEnrollStudentSearch from "@/components/BulkEnrollStudentSearch";
import { RemoveStudentsDialog } from "@/components/RemoveStudentsDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import OpenClassesTab from "@/components/OpenClassesTab";
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

const WeekAttendancePage = () => {
  const { profile } = useAuth();
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
  const { data: classes, isLoading, error, isFetching } = useTodayAttendance(startDateStr, endDateStr);
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup, isLoading: loadingWhatsAppGroup } = useCurrentUserWhatsAppGroup();
  const { data: allWhatsAppGroups, isLoading: loadingAllGroups } = useAllWhatsAppGroups(profile?.club_id || undefined);
  const [expandedWaitlist, setExpandedWaitlist] = useState<string | null>(null);
  const [substituteDialog, setSubstituteDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    selectedDate: string;
  }>({
    open: false,
    classId: '',
    className: '',
    selectedDate: '',
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

  // Solo administradores pueden notificar por WhatsApp
  const isAdmin = profile?.role === 'admin';
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

  // Estado para diálogo de cancelación de clase
  const [cancelClassDialog, setCancelClassDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    classDate: string;
  }>({
    open: false,
    classId: '',
    className: '',
    classDate: '',
  });

  // Hooks para acciones del profesor
  const markAttendance = useTrainerMarkAttendance();
  const markAbsence = useTrainerMarkAbsence();
  const clearStatus = useTrainerClearStatus();
  const removeParticipant = useRemoveParticipant();
  const cancelClass = useCancelClass();
  const { data: cancelledClasses = [] } = useCancelledClasses();

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

  // Filter classes by selected date
  const filteredClasses = useMemo(() => {
    if (!selectedDate || !classes) return classes || [];

    const selectedDayName = getDayOfWeekInSpanish(new Date(selectedDate));
    return classes.filter(cls => cls.days_of_week?.includes(selectedDayName));
  }, [classes, selectedDate]);

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
    const confirmedParticipants = classesToCount.reduce(
      (acc, c) => acc + c.participants.filter(p => p.attendance_confirmed_for_date).length,
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

  const handleConfirmAbsence = (participantId: string, participantName: string) => {
    setConfirmDialog({
      open: true,
      type: 'absence',
      participantId,
      participantName,
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

  // Handler para cancelar clase
  const handleCancelClass = (classId: string, className: string, classDate: string) => {
    setCancelClassDialog({
      open: true,
      classId,
      className,
      classDate,
    });
  };

  // Ejecutar cancelación de clase
  const executeCancelClass = () => {
    cancelClass.mutate({
      classId: cancelClassDialog.classId,
      cancelledDate: cancelClassDialog.classDate,
      reason: 'Cancelada por profesor/admin',
    });
    setCancelClassDialog({ open: false, classId: '', className: '', classDate: '' });
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
    } else if (confirmDialog.type === 'absence') {
      markAbsence.mutate({
        participantId: confirmDialog.participantId,
        reason: 'Marcado por profesor',
      });
    } else if (confirmDialog.type === 'clear') {
      clearStatus.mutate(confirmDialog.participantId);
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
        classData: { ...classData, notificationDate: dateForNotification },
        notificationType: 'absence',
        selectedGroups: [],
      });
      return;
    }

    console.log('ℹ️ Un solo grupo o menos, enviando directamente');

    // Si solo hay un grupo, enviarlo directamente
    if (!whatsappGroup?.group_chat_id) {
      console.error("No WhatsApp group configured");
      return;
    }

    sendNotificationToGroup(whatsappGroup.group_chat_id, classData, dateForNotification);
  };

  const handleNotifyFreeSpot = (classData: any, dateForNotification: string) => {
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
        classData: { ...classData, notificationDate: dateForNotification },
        notificationType: 'free_spot',
        selectedGroups: [],
      });
      return;
    }

    console.log('ℹ️ Un solo grupo o menos, enviando directamente');

    // Si solo hay un grupo, enviarlo directamente
    if (!whatsappGroup?.group_chat_id) {
      console.error("No WhatsApp group configured");
      return;
    }

    sendFreeSpotNotification(whatsappGroup.group_chat_id, classData, dateForNotification);
  };

  const sendNotificationToGroup = (groupChatId: string, classData: any, dateForNotification: string) => {
    const absentCount = classData.participants.filter((p: any) => p.absence_confirmed).length;
    const substituteCount = classData.participants.filter((p: any) => p.is_substitute).length;
    const availableSlots = absentCount - substituteCount;

    // Generate waitlist URL
    const waitlistUrl = `${window.location.origin}/waitlist/${classData.id}/${dateForNotification}`;

    sendWhatsApp({
      groupChatId: groupChatId,
      className: classData.name,
      classDate: dateForNotification,
      classTime: classData.start_time,
      trainerName: classData.trainer?.full_name || 'Profesor',
      waitlistUrl,
      availableSlots: availableSlots,
      classId: classData.id
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
    const waitlistUrl = `${window.location.origin}/waitlist/${classData.id}/${dateForNotification}`;

    const params = {
      groupChatId: groupChatId,
      className: classData.name,
      classDate: dateForNotification,
      classTime: classData.start_time,
      trainerName: classData.trainer?.full_name || 'Profesor',
      waitlistUrl,
      availableSlots: totalAvailableSlots,
      classId: classData.id,
      notificationType: 'free_spot' as const
    };

    console.log('📤 Sending free spot notification with params:', params);

    sendWhatsApp(params);

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
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span>Asistencia</span>
            </h1>
            {/* Live indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              isFetching
                ? 'bg-blue-50 text-blue-700'
                : 'bg-green-50 text-green-700'
            }`}>
              <Wifi className={`h-3 w-3 sm:h-4 sm:w-4 ${isFetching ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium">
                {isFetching ? 'Actualizando...' : 'En vivo'}
              </span>
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

              // Count classes for this day
              const dayNameSpanish = getDayOfWeekInSpanish(day);
              const classCount = classes?.filter(cls => cls.days_of_week?.includes(dayNameSpanish)).length || 0;

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

          {!selectedDate && (
            <Alert className="bg-purple-50 border-purple-200">
              <Calendar className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                Mostrando <strong>todas las clases de la semana</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
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

            {/* Waitlist stats card */}
            {filteredClasses && filteredClasses.length > 0 && (
              <WaitlistStatsCard classes={filteredClasses} />
            )}
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
          {/* WhatsApp Group Warning - Solo para administradores */}
          {isAdmin && !loadingWhatsAppGroup && !whatsappGroup && (
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
                  {selectedDate ? 'No hay clases este día' : 'No hay clases esta semana'}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {selectedDate
                    ? 'No hay clases programadas para el día seleccionado'
                    : 'No hay clases programadas para esta semana en tu club'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedClasses.map((classData) => {
                const validParticipants = classData.participants.filter(p => p.student_enrollment);
                const confirmedCount = validParticipants.filter(
                  p => p.attendance_confirmed_for_date
                ).length;
                const maxParticipants = classData.max_participants || 8;
                const confirmationRate = maxParticipants > 0 ? (confirmedCount / maxParticipants) * 100 : 0;

                // Get the notification date - use selected date or today
                const notificationDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

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
                              {classData.trainer && (
                                <span className="truncate">Profesor: {classData.trainer.full_name}</span>
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
                                      clubId: profile?.club_id || '',
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
                                      clubId: profile?.club_id || '',
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
                          {canCancelClass && !isCancelled && !hasEnded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelClass(classData.id, classData.name, notificationDate)}
                              className="h-8 bg-transparent hover:bg-gray-100 border-0 text-gray-800 p-0 px-2 -mx-2 rounded-md"
                              title="Cancelar clase"
                            >
                              <X className="h-5 w-5" />
                            </Button>
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
                              const isConfirmed = !!participant.attendance_confirmed_for_date;
                              const isAbsent = !!participant.absence_confirmed;
                              const isPending = !isConfirmed && !isAbsent;
                              const isSubstitute = !!participant.is_substitute;

                              console.log('🎯 Participant render:', {
                                name: participant.student_enrollment?.full_name,
                                isConfirmed,
                                confirmed_by_trainer: participant.confirmed_by_trainer,
                                shouldShowIndicator: isConfirmed && (isAdmin || isTrainer) && participant.confirmed_by_trainer
                              });

                              return (
                                <div
                                  key={participant.id}
                                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                    isConfirmed
                                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm hover:shadow-md'
                                      : isAbsent
                                      ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 shadow-sm hover:shadow-md'
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                  }`}
                                >
                                  {/* Indicator Bar */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                    isConfirmed ? 'bg-green-500' : isAbsent ? 'bg-red-500' : 'bg-slate-300'
                                  }`} />

                                  <div className="p-4 pl-5">
                                    {/* Header Row: Info + Actions */}
                                    <div className="flex items-start justify-between gap-3">
                                      {/* Student Info */}
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* Status Icon */}
                                        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                          isConfirmed
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

                                        {/* Name */}
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-sm text-slate-900 truncate">
                                              {participant.student_enrollment!.full_name}
                                            </p>
                                            {participant.is_substitute && (
                                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                                Sustituto
                                              </Badge>
                                            )}
                                          </div>

                                          {/* Timestamp */}
                                          {(participant.attendance_confirmed_at || participant.absence_confirmed_at) && (
                                            <div className="flex items-center gap-1 mt-1">
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
                                            participant.student_enrollment!.full_name
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
                                    {isAbsent && participant.absence_reason && (
                                      <div className="mt-3 pt-3 border-t border-red-200/50">
                                        <div className="flex items-start gap-2">
                                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-red-900 mb-0.5">Motivo de ausencia</p>
                                            <p className="text-xs text-red-700">{participant.absence_reason}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Substitute Search and WhatsApp Notification */}
                      {(() => {
                        const absentCount = validParticipants.filter(p => p.absence_confirmed).length;
                        const substituteCount = validParticipants.filter(p => p.is_substitute).length;
                        const slotsByAbsence = absentCount - substituteCount;

                        // Calculate available slots by capacity
                        const maxParticipants = classData.max_participants || 8;
                        const enrolledCount = validParticipants.length;
                        const slotsByCapacity = maxParticipants - enrolledCount;

                        // Total available slots is the maximum of both
                        const totalAvailableSlots = Math.max(slotsByAbsence, slotsByCapacity);

                        return totalAvailableSlots > 0 && (
                          <div className="mt-4 space-y-3">
                            <div className="flex flex-col gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              {/* Badge de plazas disponibles */}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                  {totalAvailableSlots} {totalAvailableSlots === 1 ? 'plaza disponible' : 'plazas disponibles'}
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
                                  })}
                                  className="text-xs sm:text-sm w-full sm:flex-1 sm:min-w-[140px]"
                                >
                                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                  Sustituto
                                </Button>

                                {/* Botones WhatsApp y Lista de Espera - Solo para administradores */}
                                {isAdmin && (
                                  <>
                                    {/* Mostrar "Notificar ausencia" solo si hay ausencias sin cubrir */}
                                    {slotsByAbsence > 0 && (() => {
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

                                    {/* Botón "Comunicar hueco libre": Solo si hay plazas por CAPACIDAD, no por ausencias */}
                                    {slotsByCapacity > 0 && (() => {
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
                                              Comunicar hueco libre
                                            </>
                                          )}
                                        </Button>
                                      );
                                    })()}

                                    <WaitlistButtonWithCount
                                      classId={classData.id}
                                      classDate={notificationDate}
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
              {profile?.club_id && (
                <SubstituteStudentSearch
                  classId={substituteDialog.classId}
                  clubId={profile.club_id}
                  onSuccess={() => setSubstituteDialog({ open: false, classId: '', className: '', selectedDate: '' })}
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

          {/* Cancel Class Dialog */}
          <AlertDialog open={cancelClassDialog.open} onOpenChange={(open) => setCancelClassDialog({ ...cancelClassDialog, open })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar clase?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vas a cancelar la clase <strong>{cancelClassDialog.className}</strong> para la fecha seleccionada.
                  <br /><br />
                  La clase seguirá visible, pero aparecerá como "CANCELADA".
                  <br />
                  La cancelación solo afecta a esa fecha concreta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeCancelClass}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirmar cancelación
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
const WaitlistStatsCard = ({ classes }: { classes: any[] }) => {
  // Fetch waitlist data for all classes
  const waitlistQueries = classes.map(classData => {
    const classDate = classData.scheduled_date || format(new Date(), 'yyyy-MM-dd');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClassWaitlist(classData.id, classDate);
  });

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
      size="sm"
      variant="outline"
      onClick={onToggle}
      className="text-xs sm:text-sm w-full sm:flex-1 sm:min-w-[140px]"
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

export default WeekAttendancePage;
