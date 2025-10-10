import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, User, MapPin, CheckCircle2, AlertCircle, XCircle, Calendar } from "lucide-react";
import { useTodayClassAttendance, useConfirmAttendance, useCancelAttendanceConfirmation, useConfirmAbsence, useCancelAbsenceConfirmation } from "@/hooks/useTodayClassAttendance";
import ConfirmAbsenceDialog from "./ConfirmAbsenceDialog";

export const TodayClassesConfirmation = () => {
  const { data: todayClasses = [], isLoading } = useTodayClassAttendance();
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
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (isLoading) {
    return (
      <Card className="border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            Próximas clases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todayClasses.length === 0) {
    return (
      <Card className="border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            Próximas clases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No tienes clases programadas en los próximos 10 días
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ¡Disfruta tu tiempo libre! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confirmedCount = todayClasses.filter(c => c.attendance_confirmed_for_date).length;
  const pendingCount = todayClasses.length - confirmedCount;

  return (
    <div className="space-y-4">
      {/* Header with title and badges */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            Próximas Clases
          </h2>
        </div>
      </div>

      {/* Grid of class cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {todayClasses.map((classItem: any) => {
          const isConfirmed = !!classItem.attendance_confirmed_for_date;
          const scheduledDate = classItem.scheduled_date;
          const isConfirmedForThisDate = classItem.attendance_confirmed_for_date === scheduledDate;
          const isAbsent = !!classItem.absence_confirmed;

          return (
            <Card
              key={`${classItem.id}-${scheduledDate}`}
              className="transition-all bg-white border-gray-300 hover:border-gray-400"
            >
              <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-black" />
                      <span className="text-sm font-medium text-black">{formatDate(scheduledDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-black">{classItem.programmed_class.name}</h3>
                    {isConfirmedForThisDate && (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Asistiré
                      </Badge>
                    )}
                    {isAbsent && (
                      <Badge className="bg-red-600 text-white">
                        <XCircle className="h-3 w-3 mr-1" />
                        No asistiré
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{classItem.programmed_class.start_time} ({classItem.programmed_class.duration_minutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{classItem.programmed_class.trainer?.full_name || 'Entrenador no asignado'}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.programmed_class.club.name}</span>
                    </div>
                  </div>

                  {/* Show absence reason if present */}
                  {isAbsent && classItem.absence_reason && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                      <strong>Motivo:</strong> {classItem.absence_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {!isAbsent && (
                    <div className="flex flex-col items-center gap-2">
                      <Checkbox
                        id={`attendance-${classItem.id}-${scheduledDate}`}
                        checked={isConfirmedForThisDate}
                        onCheckedChange={() => handleToggleConfirmation(classItem.id, isConfirmedForThisDate, scheduledDate)}
                        disabled={confirmAttendance.isPending || cancelConfirmation.isPending}
                        className="h-6 w-6 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <label
                        htmlFor={`attendance-${classItem.id}-${scheduledDate}`}
                        className="text-xs text-center cursor-pointer select-none"
                      >
                        {isConfirmedForThisDate ? 'Asistiré' : 'Confirmar'}
                      </label>
                    </div>
                  )}

                  {/* Absence button */}
                  {!isConfirmedForThisDate && !isAbsent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAbsenceDialog(classItem.id)}
                      disabled={confirmAbsence.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      No voy
                    </Button>
                  )}

                  {/* Cancel absence button */}
                  {isAbsent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelAbsence(classItem.id)}
                      disabled={cancelAbsence.isPending}
                      className="border-gray-300"
                    >
                      Cancelar ausencia
                    </Button>
                  )}
                </div>
              </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pendingCount > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              <strong>Recuerda:</strong> Confirma tu asistencia para que tu entrenador sepa que asistirás a clase.
            </span>
          </p>
        </div>
      )}

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
