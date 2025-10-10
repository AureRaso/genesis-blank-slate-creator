import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, User, MapPin, CheckCircle2, AlertCircle, XCircle, Calendar, Zap, Target, Users } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Próximas clases</h2>
          </div>
        </div>
      </div>

      {/* Reminder Banner - Always visible */}
      <div className="w-1/2">
        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Confirma tu asistencia
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Ayuda a tu entrenador a planificar mejor las clases confirmando tu disponibilidad.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <CardContent className="p-8">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatDate(scheduledDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-800">
                        {formatTime(classItem.programmed_class.start_time)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-3">
                  {/* Class Name */}
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">
                    {classItem.programmed_class.name}
                  </h3>

                  {/* Trainer Info */}
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="p-1 bg-primary/10 rounded">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      {classItem.programmed_class.trainer?.full_name || 'Entrenador no asignado'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/60">
                  {/* Attendance Checkbox - Takes half width */}
                  {!isAbsent && (
                    <div className="flex items-center gap-3 w-1/2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`attendance-${classItem.id}-${scheduledDate}`}
                          checked={isConfirmedForThisDate}
                          onCheckedChange={() => handleToggleConfirmation(classItem.id, isConfirmedForThisDate, scheduledDate)}
                          disabled={confirmAttendance.isPending || cancelConfirmation.isPending}
                          className={`
                            h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600
                            border-2 border-slate-300
                          `}
                        />
                        <label
                          htmlFor={`attendance-${classItem.id}-${scheduledDate}`}
                          className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                        >
                          {isConfirmedForThisDate ? 'Asistencia confirmada' : 'Confirmar asistencia'}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Group */}
                  <div className="flex items-center gap-2">
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
                    {isAbsent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelAbsence(classItem.id)}
                        disabled={cancelAbsence.isPending}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 px-3 py-1 h-8"
                      >
                        Cancelar asuencia
                      </Button>
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