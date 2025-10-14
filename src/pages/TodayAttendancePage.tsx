import { useState } from "react";
import { useTodayAttendance } from "@/hooks/useTodayAttendance";
import { useSendWhatsAppNotification } from "@/hooks/useWhatsAppNotification";
import { useCurrentUserWhatsAppGroup } from "@/hooks/useWhatsAppGroup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle2, XCircle, Clock, Users, Wifi, MessageCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import WaitlistManagement from "@/components/WaitlistManagement";

const TodayAttendancePage = () => {
  const { data: classes, isLoading, error, isFetching } = useTodayAttendance();
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup, isLoading: loadingWhatsAppGroup } = useCurrentUserWhatsAppGroup();
  const [expandedWaitlist, setExpandedWaitlist] = useState<string | null>(null);

  const handleNotifyWhatsApp = (classData: any) => {
    if (!whatsappGroup?.group_chat_id) {
      console.error("No WhatsApp group configured");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const absentCount = classData.participants.filter((p: any) => p.absence_confirmed).length;

    // Generate waitlist URL
    const waitlistUrl = `${window.location.origin}/waitlist/${classData.id}/${today}`;

    sendWhatsApp({
      groupChatId: whatsappGroup.group_chat_id,
      className: classData.name,
      classDate: today,
      classTime: classData.start_time,
      trainerName: classData.trainer?.full_name || 'Profesor',
      waitlistUrl,
      availableSlots: absentCount
    });
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

  // Calculate statistics
  const totalClasses = classes?.length || 0;
  const totalParticipants = classes?.reduce((acc, c) => acc + c.participants.length, 0) || 0;
  const confirmedParticipants = classes?.reduce(
    (acc, c) => acc + c.participants.filter(p => p.attendance_confirmed_for_date).length,
    0
  ) || 0;
  const absentParticipants = classes?.reduce(
    (acc, c) => acc + c.participants.filter(p => p.absence_confirmed).length,
    0
  ) || 0;

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-playtomic-orange flex-shrink-0" />
              <span className="truncate">Asistencia de Hoy</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 capitalize truncate">{formattedDate}</p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>
      </div>

      {/* WhatsApp Group Warning */}
      {!loadingWhatsAppGroup && !whatsappGroup && (
        <Alert variant="destructive" className="text-xs sm:text-sm">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            No tienes un grupo de WhatsApp configurado. Las notificaciones de disponibilidad no funcionarán hasta que configures un grupo.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
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
      </div>

      {/* Classes List */}
      {!classes || classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay clases hoy</h3>
            <p className="text-sm text-muted-foreground text-center">
              No hay clases programadas para hoy en tu club
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((classData) => {
            const validParticipants = classData.participants.filter(p => p.student_enrollment);
            const confirmedCount = validParticipants.filter(
              p => p.attendance_confirmed_for_date
            ).length;
            const totalCount = validParticipants.length;
            const confirmationRate = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0;

            return (
              <Card key={classData.id}>
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base sm:text-xl truncate">{classData.name}</CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{classData.start_time} ({classData.duration_minutes} min)</span>
                        </span>
                        {classData.trainer && (
                          <span className="truncate">Profesor: {classData.trainer.full_name}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={confirmationRate === 100 ? "default" : confirmationRate >= 50 ? "secondary" : "destructive"}
                      className="text-xs flex-shrink-0 self-start"
                    >
                      {confirmedCount}/{totalCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {validParticipants.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      No hay alumnos inscritos en esta clase
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-medium mb-3">Alumnos ({totalCount})</h4>
                      <div className="grid gap-2">
                        {validParticipants.map((participant) => {
                          const isConfirmed = !!participant.attendance_confirmed_for_date;
                          const isAbsent = !!participant.absence_confirmed;

                          return (
                            <div
                              key={participant.id}
                              className={`p-2 sm:p-3 rounded-lg border ${
                                isConfirmed
                                  ? 'bg-green-50 border-green-200'
                                  : isAbsent
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  {isConfirmed ? (
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                  ) : isAbsent ? (
                                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium text-xs sm:text-sm truncate">
                                        {participant.student_enrollment!.full_name}
                                      </p>
                                      {participant.is_substitute && (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex-shrink-0">
                                          Sustituto
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                      {participant.student_enrollment!.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {isConfirmed ? (
                                    <Badge variant="default" className="bg-green-600 text-xs hidden sm:inline-flex">
                                      Confirmado
                                    </Badge>
                                  ) : isAbsent ? (
                                    <Badge variant="destructive" className="bg-red-600 text-xs hidden sm:inline-flex">
                                      No asistirá
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-600 text-xs hidden sm:inline-flex">
                                      Pendiente
                                    </Badge>
                                  )}
                                  {participant.attendance_confirmed_at && (
                                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                      {format(new Date(participant.attendance_confirmed_at), 'HH:mm')}
                                    </p>
                                  )}
                                  {participant.absence_confirmed_at && (
                                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                      {format(new Date(participant.absence_confirmed_at), 'HH:mm')}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Show absence reason if present */}
                              {isAbsent && participant.absence_reason && (
                                <div className="mt-2 pt-2 border-t border-red-200">
                                  <p className="text-xs text-red-800">
                                    <strong>Motivo:</strong> {participant.absence_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Notification and Waitlist Management */}
                  {(() => {
                    const absentCount = validParticipants.filter(p => p.absence_confirmed).length;
                    const today = new Date().toISOString().split('T')[0];

                    return absentCount > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                              {absentCount} {absentCount === 1 ? 'plaza disponible' : 'plazas disponibles'}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => handleNotifyWhatsApp(classData)}
                              disabled={isSendingWhatsApp || !whatsappGroup}
                              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto"
                              title={!whatsappGroup ? "No hay grupo de WhatsApp configurado" : "Enviar notificación al grupo"}
                            >
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Notificar Disponibilidad</span>
                              <span className="sm:hidden ml-2">Notificar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleWaitlist(classData.id)}
                              className="text-xs sm:text-sm w-full sm:w-auto"
                            >
                              {expandedWaitlist === classData.id ? (
                                <>
                                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Ocultar Lista</span>
                                  <span className="sm:hidden ml-2">Ocultar</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Ver Lista de Espera</span>
                                  <span className="sm:hidden ml-2">Ver Lista</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Waitlist Management Panel */}
                        {expandedWaitlist === classData.id && (
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
    </div>
  );
};

export default TodayAttendancePage;
