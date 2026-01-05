import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, MapPin, CheckCircle2, AlertCircle, XCircle, Calendar, Zap, Target, Users, CalendarPlus, Bell, Save } from "lucide-react";
import { useTodayClassAttendance } from "@/hooks/useTodayClassAttendance";
import { useConfirmAttendance, useCancelAttendanceConfirmation, useConfirmAbsence, useCancelAbsence } from "@/hooks/useAttendanceConfirmations";
import { AttendanceToggle } from "./AttendanceToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useMyWaitlistRequests } from "@/hooks/useClassWaitlist";
import { format } from "date-fns";
import { es, enUS, it } from "date-fns/locale";
import { ClassWaitlist } from "@/types/waitlist";
import { useTranslation } from "react-i18next";

interface TodayClassesConfirmationProps {
  selectedChildId?: string;
}

export const TodayClassesConfirmation = ({ selectedChildId }: TodayClassesConfirmationProps) => {
  const { isGuardian } = useAuth();
  const { data: allClasses = [], isLoading } = useTodayClassAttendance();
  const { data: waitlistRequests = [], isLoading: loadingWaitlist } = useMyWaitlistRequests();
  const { t, i18n } = useTranslation();

  // Get locale for date-fns based on current language
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'it': return it;
      default: return es;
    }
  };


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
  const cancelAbsence = useCancelAbsence();

  // Estado para manejar el toggle y motivo de ausencia
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [absenceReasons, setAbsenceReasons] = useState<Record<string, string>>({});
  const [selectedReasonType, setSelectedReasonType] = useState<Record<string, string>>({});

  // Manejar cambio del toggle
  const handleToggleAttendance = (participantId: string, willAttend: boolean, scheduledDate: string) => {
    const uniqueKey = `${participantId}-${scheduledDate}`;
    if (willAttend) {
      // Cambió a "VOY" - cancelar ausencia Y confirmar asistencia
      cancelAbsence.mutate({ classParticipantId: participantId, scheduledDate }, {
        onSuccess: () => {
          // Después de cancelar la ausencia, confirmar la asistencia
          confirmAttendance.mutate({ classParticipantId: participantId, scheduledDate });
        }
      });
      setExpandedClassId(null);
    } else {
      // Cambió a "NO VOY" - expandir para mostrar motivo
      setExpandedClassId(uniqueKey);
    }
  };

  // Guardar ausencia con motivo
  const handleSaveAbsence = (participantId: string, scheduledDate: string) => {
    const uniqueKey = `${participantId}-${scheduledDate}`;
    const reasonType = selectedReasonType[uniqueKey] || '';
    const customReason = absenceReasons[uniqueKey] || '';

    let finalReason = '';
    if (reasonType === 'otro') {
      finalReason = customReason;
    } else if (reasonType) {
      finalReason = reasonType;
    }

    confirmAbsence.mutate(
      { classParticipantId: participantId, scheduledDate, reason: finalReason },
      {
        onSuccess: () => {
          setExpandedClassId(null);
          setAbsenceReasons(prev => ({ ...prev, [uniqueKey]: '' }));
          setSelectedReasonType(prev => ({ ...prev, [uniqueKey]: '' }));
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const localeCode = i18n.language === 'en' ? 'en-US' : i18n.language === 'it' ? 'it-IT' : 'es-ES';
    const formatted = date.toLocaleDateString(localeCode, {
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
    const trainer2Name = classItem.programmed_class.trainer_2?.full_name;
    const fullTrainerName = trainer2Name ? `${trainerName} y ${trainer2Name}` : trainerName;

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
    googleCalendarUrl.searchParams.append('details', `Clase de pádel con ${fullTrainerName}`);
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
            {t('playerDashboard.upcomingClasses')}
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

  // Helper functions for waitlist section
  const formatWaitlistDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const formatString = i18n.language === 'es' ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d";
    return format(date, formatString, { locale: getDateLocale() });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            {t('playerDashboard.waitlistPending')}
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('playerDashboard.waitlistAccepted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {t('playerDashboard.waitlistRejected')}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render waitlist section helper
  const renderWaitlistSection = () => {
    if (waitlistRequests.length === 0) return null;

    return (
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800">{t('playerDashboard.waitlistRequests')}</h3>
        </div>

        <div className="space-y-2">
          {waitlistRequests.map((request: ClassWaitlist) => {
            const isPending = request.status === 'pending';
            const isAccepted = request.status === 'accepted';
            const isRejected = request.status === 'rejected';

            return (
              <Card
                key={request.id}
                className={`
                  border-0 shadow-md rounded-xl transition-all duration-300
                  ${isPending
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50/30 border-l-4 border-l-amber-400'
                    : isAccepted
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50/30 border-l-4 border-l-green-400'
                      : 'bg-gradient-to-br from-red-50 to-rose-50/30 border-l-4 border-l-red-400'
                  }
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(request.status)}
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1 truncate">
                        {request.programmed_class?.name || 'Clase'}
                      </h4>
                      <div className="space-y-1 text-xs sm:text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="capitalize">{formatWaitlistDate(request.class_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{formatTime(request.programmed_class?.start_time || '')}</span>
                        </div>
                        {(request.programmed_class?.trainer?.full_name || request.programmed_class?.trainer_2?.full_name) && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {request.programmed_class.trainer?.full_name}
                              {request.programmed_class.trainer_2?.full_name && `, ${request.programmed_class.trainer_2.full_name}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status messages */}
                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <p className="text-xs text-amber-800">
                        <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                        {t('playerDashboard.waitlistBeingReviewed')}
                      </p>
                    </div>
                  )}
                  {isAccepted && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-800 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                        {t('playerDashboard.waitlistAcceptedInClass')}
                      </p>
                    </div>
                  )}
                  {isRejected && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-800">
                        <XCircle className="h-3.5 w-3.5 inline mr-1" />
                        {t('playerDashboard.waitlistNoSpots')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (todayClasses.length === 0) {
    return (
      <div className="space-y-4">
        {/* Waitlist section - show even when no classes */}
        {renderWaitlistSection()}

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            {t('playerDashboard.myClassesTitle')}
          </h2>
        </div>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white rounded-2xl text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('playerDashboard.noScheduledClasses')}</h3>
            <p className="text-slate-500 text-sm">
              {t('playerDashboard.noClassesNext10Days')}
            </p>
            <p className="text-slate-400 text-xs mt-2">
              {t('playerDashboard.enjoyFreeTime')}
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
      {/* Waitlist Notifications Section */}
      {renderWaitlistSection()}

      {/* Header - Responsive: stacked on mobile, inline on desktop */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t('playerDashboard.upcomingClasses')}</h2>
        </div>

        {/* Reminder Banner - Full width on mobile, 50% on desktop */}
        <div className="w-full md:w-1/2">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-800">
                  {t('playerDashboard.autoConfirmed')}
                </p>
                <p className="text-xs text-green-600 mt-0.5 sm:mt-1 line-clamp-2">
                  {t('playerDashboard.releaseSpotHint')}
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
          const isCancelled = !!classItem.is_cancelled;

          return (
            <Card
              key={`${classItem.id}-${scheduledDate}`}
              className={`
                border-0 shadow-lg rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
                ${isCancelled
                  ? 'bg-gradient-to-br from-gray-50 to-slate-100/30 border-l-4 border-l-gray-400 opacity-75'
                  : isAbsent
                    ? 'bg-gradient-to-br from-red-50 to-rose-100/30 border-l-4 border-l-red-400'
                    : isConfirmedForThisDate
                      ? 'bg-gradient-to-br from-green-50 to-emerald-100/30 border-l-4 border-l-green-400'
                      : 'bg-gradient-to-br from-slate-50 to-white border-l-4 border-l-primary'
                }
              `}
            >
              <CardContent className="p-3 sm:p-4 lg:p-5">
                {/* Header Section - Responsive */}
                <div className="flex items-start justify-between mb-2 sm:mb-3">
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
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Class Name with Cancelled Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight line-clamp-2">
                      {classItem.programmed_class.name}
                    </h3>
                    {isCancelled && (
                      <Badge variant="destructive" className="text-xs">
                        {t('playerDashboard.cancelled')}
                      </Badge>
                    )}
                  </div>

                  {/* Trainer Info */}
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="p-0.5 bg-primary/10 rounded flex-shrink-0">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium truncate">
                      {classItem.programmed_class.trainer?.full_name || t('playerDashboard.noTrainerAssigned')}
                      {classItem.programmed_class.trainer_2?.full_name && `, ${classItem.programmed_class.trainer_2.full_name}`}
                    </span>
                  </div>
                </div>

                {/* Toggle de Asistencia - Compacto */}
                <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200/60">
                  {isCancelled ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-200">
                      <AlertCircle className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs text-gray-700 font-medium">
                        {t('playerDashboard.classCancelledByClub')}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Toggle Component */}
                      <AttendanceToggle
                        isAttending={!isAbsent}
                        onChange={(willAttend) => handleToggleAttendance(classItem.id, willAttend, scheduledDate)}
                        disabled={cancelAbsence.isPending || confirmAbsence.isPending || classItem.absence_locked}
                      />

                      {/* Absence Reason Section - Solo visible cuando NO asiste */}
                      {(!isAbsent && expandedClassId === `${classItem.id}-${scheduledDate}`) && (
                        <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-1.5 text-red-800 font-medium text-xs">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{t('playerDashboard.absenceReason')}</span>
                          </div>

                          {/* Selector de motivo */}
                          <Select
                            value={selectedReasonType[`${classItem.id}-${scheduledDate}`] || ''}
                            onValueChange={(value) => setSelectedReasonType(prev => ({ ...prev, [`${classItem.id}-${scheduledDate}`]: value }))}
                          >
                            <SelectTrigger className="w-full bg-white h-9 text-xs">
                              <SelectValue placeholder={t('playerDashboard.selectReason')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lesion">{t('playerDashboard.reasonInjury')}</SelectItem>
                              <SelectItem value="trabajo">{t('playerDashboard.reasonWork')}</SelectItem>
                              <SelectItem value="enfermedad">{t('playerDashboard.reasonSickness')}</SelectItem>
                              <SelectItem value="familiar">{t('playerDashboard.reasonFamily')}</SelectItem>
                              <SelectItem value="otro">{t('playerDashboard.reasonOther')}</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Campo de texto personalizado */}
                          {selectedReasonType[`${classItem.id}-${scheduledDate}`] === 'otro' && (
                            <Textarea
                              placeholder={t('playerDashboard.describeReason')}
                              value={absenceReasons[`${classItem.id}-${scheduledDate}`] || ''}
                              onChange={(e) => setAbsenceReasons(prev => ({ ...prev, [`${classItem.id}-${scheduledDate}`]: e.target.value }))}
                              className="w-full min-h-[60px] bg-white text-xs"
                            />
                          )}

                          {/* Botón guardar */}
                          <Button
                            onClick={() => handleSaveAbsence(classItem.id, scheduledDate)}
                            disabled={confirmAbsence.isPending}
                            size="sm"
                            className="w-full bg-red-500 hover:bg-red-600 text-white h-8 text-xs"
                          >
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                            {confirmAbsence.isPending ? t('playerDashboard.saving') : t('playerDashboard.saveAbsence')}
                          </Button>
                        </div>
                      )}

                      {/* Mostrar motivo guardado */}
                      {isAbsent && classItem.absence_reason && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-800">
                            <strong>{t('playerDashboard.reasonLabel')}</strong> {classItem.absence_reason}
                          </p>
                        </div>
                      )}

                      {/* Locked Absence Warning */}
                      {isAbsent && classItem.absence_locked && (
                        <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">
                            {t('playerDashboard.absenceRegistered')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};