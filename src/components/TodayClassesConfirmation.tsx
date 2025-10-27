import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, User, MapPin, CheckCircle2, AlertCircle, XCircle, Calendar, Zap, Target, Users, CalendarPlus } from "lucide-react";
import { useTodayClassAttendance, useConfirmAttendance, useCancelAttendanceConfirmation, useConfirmAbsence, useCancelAbsenceConfirmation } from "@/hooks/useTodayClassAttendance";
import ConfirmAbsenceDialog from "./ConfirmAbsenceDialog";
import { useAuth } from "@/contexts/AuthContext";

interface TodayClassesConfirmationProps {
  selectedChildId?: string;
}

export const TodayClassesConfirmation = ({ selectedChildId }: TodayClassesConfirmationProps) => {
  const { isGuardian } = useAuth();
  const { data: allClasses = [], isLoading } = useTodayClassAttendance();

  // Filter classes based on selected child
  const todayClasses = useMemo(() => {
    if (!isGuardian || !selectedChildId || selectedChildId === "all") {
      return allClasses;
    }

    // Filter classes that belong to the selected child
    return allClasses.filter((classItem: any) => {
      return classItem.student_enrollment?.student_profile_id === selectedChildId;
    });
  }, [allClasses, selectedChildId, isGuardian]);
  const confirmAttendance = useConfirmAttendance();
  const cancelConfirmation = useCancelAttendanceConfirmation();
  const confirmAbsence = useConfirmAbsence();
  const cancelAbsence = useCancelAbsenceConfirmation();

  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const handleToggleConfirmation = (participantId: string, isConfirmed: boolean, scheduledDate: string) => {
    if (isConfirmed) {
      cancelConfirmation.mutate(participantId);
    } else {
      confirmAttendance.mutate({ participantId, scheduledDate });
    }
  };

  const handleOpenAbsenceDialog = (participantId: string) => {
    setSelectedClassId(participantId);
    setAbsenceDialogOpen(true);
  };

  const handleConfirmAbsence = (reason?: string) => {
    if (selectedClassId) {
      confirmAbsence.mutate(
        { participantId: selectedClassId, reason },
        {
          onSuccess: () => {
            setAbsenceDialogOpen(false);
            setSelectedClassId(null);
          },
        }
      );
    }
  };

  const handleCancelAbsence = (participantId: string) => {
    cancelAbsence.mutate(participantId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const addToGoogleCalendar = (classItem: any) => {
    const scheduledDate = classItem.scheduled_date;
    const startTime = classItem.programmed_class.start_time;
    const endTime = classItem.programmed_class.end_time;
    const duration = classItem.programmed_class.duration_minutes || 60; // Duración por defecto 60 min
    const className = classItem.programmed_class.name;
    const trainerName = classItem.programmed_class.trainer?.full_name || 'Entrenador';

    // Normalizar tiempos (asegurar formato HH:MM:SS)
    const normalizeTime = (time: string) => {
      if (!time) return '00:00:00';
      const parts = time.split(':');
      if (parts.length === 2) return `${time}:00`;
      return time;
    };

    const normalizedStartTime = normalizeTime(startTime);

    // Crear fecha de inicio
    const startDateTime = new Date(`${scheduledDate}T${normalizedStartTime}`);

    // Calcular fecha de fin
    let endDateTime: Date;
    if (endTime) {
      // Si hay end_time, usarlo
      const normalizedEndTime = normalizeTime(endTime);
      endDateTime = new Date(`${scheduledDate}T${normalizedEndTime}`);
    } else {
      // Si no hay end_time, calcular usando la duración
      endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));
    }

    // Formatear en formato Google Calendar (YYYYMMDDTHHmmss) en hora local
    const formatForGoogleCalendar = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const startFormatted = formatForGoogleCalendar(startDateTime);
    const endFormatted = formatForGoogleCalendar(endDateTime);

    // Crear la URL de Google Calendar
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', `${className}`);
    googleCalendarUrl.searchParams.append('details', `Clase de pádel con ${trainerName}`);
    googleCalendarUrl.searchParams.append('dates', `${startFormatted}/${endFormatted}`);
    googleCalendarUrl.searchParams.append('ctz', 'Europe/Madrid');

    // Abrir en nueva ventana
    window.open(googleCalendarUrl.toString(), '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Próximas clases
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <Card key={item} className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (todayClasses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Próximas clases
          </h2>
        </div>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white rounded-2xl text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Sin clases programadas</h3>
            <p className="text-slate-500 text-sm">
              No tienes clases en los próximos 10 días
            </p>
            <p className="text-slate-400 text-xs mt-2">
              ¡Disfruta tu tiempo libre! 🎉
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confirmedCount = todayClasses.filter(c => c.attendance_confirmed_for_date).length;
  const pendingCount = todayClasses.length - confirmedCount;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive: stacked on mobile, inline on desktop */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Próximas clases</h2>
        </div>

        {/* Reminder Banner - Full width on mobile, 50% on desktop */}
        <div className="w-full md:w-1/2">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-amber-800">
                  Confirma tu asistencia
                </p>
                <p className="text-xs text-amber-600 mt-0.5 sm:mt-1 line-clamp-2">
                  Ayuda a tu entrenador a planificar mejor las clases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Class Cards Grid - Single column on mobile, 2 columns on tablet/desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {todayClasses.map((classItem: any) => {
          const isConfirmed = !!classItem.attendance_confirmed_for_date;
          const scheduledDate = classItem.scheduled_date;
          const isConfirmedForThisDate = classItem.attendance_confirmed_for_date === scheduledDate;
          const isAbsent = !!classItem.absence_confirmed;

          return (
            <Card
              key={`${classItem.id}-${scheduledDate}`}
              className={`
                border-0 shadow-lg rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
                ${isConfirmedForThisDate 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-100/30 border-l-4 border-l-green-400' 
                  : isAbsent
                    ? 'bg-gradient-to-br from-red-50 to-rose-100/30 border-l-4 border-l-red-400'
                    : 'bg-gradient-to-br from-slate-50 to-white border-l-4 border-l-primary'
                }
              `}
            >
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Header Section - Responsive */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">
                        {formatDate(scheduledDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                      <span className="text-base sm:text-lg font-bold text-slate-800">
                        {formatTime(classItem.programmed_class.start_time)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Details - Responsive */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Class Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight line-clamp-2">
                    {classItem.programmed_class.name}
                  </h3>

                  {/* Trainer Info */}
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="p-1 bg-primary/10 rounded flex-shrink-0">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {classItem.programmed_class.trainer?.full_name || 'Entrenador no asignado'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Responsive: stacked on mobile, inline on desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mt-4 sm:mt-6 pt-4 border-t border-slate-200/60">
                  {/* Action Buttons Group */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Attendance Button */}
                      {!isAbsent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleConfirmation(classItem.id, isConfirmedForThisDate, scheduledDate)}
                          disabled={confirmAttendance.isPending || cancelConfirmation.isPending}
                          className={`
                            px-3 py-1 h-8
                            ${isConfirmedForThisDate
                              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-400'
                              : 'border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                            }
                          `}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Voy
                        </Button>
                      )}

                      {/* Absence Button */}
                      {!isConfirmedForThisDate && !isAbsent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAbsenceDialog(classItem.id)}
                          disabled={confirmAbsence.isPending}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 px-3 py-1 h-8"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          No voy
                        </Button>
                      )}

                      {/* Cancel Absence Button */}
                      {isAbsent && !classItem.absence_locked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAbsence(classItem.id)}
                          disabled={cancelAbsence.isPending}
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 px-3 py-1 h-8"
                        >
                          Cancelar ausencia
                        </Button>
                      )}

                      {/* Add to Google Calendar Button - Visible on mobile */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToGoogleCalendar(classItem)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 px-3 py-1 h-8 md:hidden"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                        Agregar
                      </Button>
                    </div>

                    {/* Locked Absence Warning */}
                    {isAbsent && classItem.absence_locked && (
                      <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                        Tu ausencia ha sido registrada correctamente. No es posible realizar cambios en este momento. ¡Gracias por avisar!                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Absence confirmation dialog */}
      <ConfirmAbsenceDialog
        open={absenceDialogOpen}
        onOpenChange={setAbsenceDialogOpen}
        onConfirm={handleConfirmAbsence}
        isLoading={confirmAbsence.isPending}
      />
    </div>
  );
};