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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-playtomic-orange" />
              Asistencia de Hoy
            </h1>
            <p className="text-muted-foreground mt-1 capitalize">{formattedDate}</p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              isFetching
                ? 'bg-blue-50 text-blue-700'
                : 'bg-green-50 text-green-700'
            }`}>
              <Wifi className={`h-4 w-4 ${isFetching ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium">
                {isFetching ? 'Actualizando...' : 'En vivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Group Warning */}
      {!loadingWhatsAppGroup && !whatsappGroup && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No tienes un grupo de WhatsApp configurado. Las notificaciones de disponibilidad no funcionarán hasta que configures un grupo.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Clases programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">Alumnos esperados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistirán</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {confirmedParticipants}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalParticipants > 0
                ? `${Math.round((confirmedParticipants / totalParticipants) * 100)}% confirmado`
                : 'Sin confirmaciones'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Asistirán</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {absentParticipants}
            </div>
            <p className="text-xs text-muted-foreground">
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
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{classData.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {classData.start_time} ({classData.duration_minutes} min)
                        </span>
                        {classData.trainer && (
                          <span>Profesor: {classData.trainer.full_name}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={confirmationRate === 100 ? "default" : confirmationRate >= 50 ? "secondary" : "destructive"}
                    >
                      {confirmedCount}/{totalCount} confirmados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {validParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No hay alumnos inscritos en esta clase
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium mb-3">Alumnos ({totalCount})</h4>
                      <div className="grid gap-2">
                        {validParticipants.map((participant) => {
                          const isConfirmed = !!participant.attendance_confirmed_for_date;
                          const isAbsent = !!participant.absence_confirmed;

                          return (
                            <div
                              key={participant.id}
                              className={`p-3 rounded-lg border ${
                                isConfirmed
                                  ? 'bg-green-50 border-green-200'
                                  : isAbsent
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isConfirmed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : isAbsent ? (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-gray-400" />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">
                                        {participant.student_enrollment!.full_name}
                                      </p>
                                      {participant.is_substitute && (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                          Sustituto
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {participant.student_enrollment!.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isConfirmed ? (
                                    <Badge variant="default" className="bg-green-600">
                                      Confirmado
                                    </Badge>
                                  ) : isAbsent ? (
                                    <Badge variant="destructive" className="bg-red-600">
                                      No asistirá
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-600">
                                      Pendiente
                                    </Badge>
                                  )}
                                  {participant.attendance_confirmed_at && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(participant.attendance_confirmed_at), 'HH:mm')}
                                    </p>
                                  )}
                                  {participant.absence_confirmed_at && (
                                    <p className="text-xs text-muted-foreground mt-1">
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
                        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              {absentCount} {absentCount === 1 ? 'plaza disponible' : 'plazas disponibles'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleNotifyWhatsApp(classData)}
                              disabled={isSendingWhatsApp || !whatsappGroup}
                              className="bg-green-600 hover:bg-green-700"
                              title={!whatsappGroup ? "No hay grupo de WhatsApp configurado" : "Enviar notificación al grupo"}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Notificar Disponibilidad
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleWaitlist(classData.id)}
                            >
                              {expandedWaitlist === classData.id ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                  Ocultar Lista
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  Ver Lista de Espera
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
