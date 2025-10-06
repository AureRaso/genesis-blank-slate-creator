import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, User, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useTodayClassAttendance, useConfirmAttendance, useCancelAttendanceConfirmation } from "@/hooks/useTodayClassAttendance";

export const TodayClassesConfirmation = () => {
  const { data: todayClasses = [], isLoading } = useTodayClassAttendance();
  const confirmAttendance = useConfirmAttendance();
  const cancelConfirmation = useCancelAttendanceConfirmation();

  const handleToggleConfirmation = (participantId: string, isConfirmed: boolean) => {
    if (isConfirmed) {
      cancelConfirmation.mutate(participantId);
    } else {
      confirmAttendance.mutate(participantId);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Clock className="h-5 w-5" />
            Clases de Hoy
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
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clases de Hoy
          </CardTitle>
          <CardDescription>{getCurrentDate()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No tienes clases programadas para hoy
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ¡Disfruta tu día libre! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confirmedCount = todayClasses.filter(c => c.attendance_confirmed_for_date).length;
  const pendingCount = todayClasses.length - confirmedCount;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Clock className="h-5 w-5" />
              Clases de Hoy - Confirma tu Asistencia
            </CardTitle>
            <CardDescription className="mt-1">{getCurrentDate()}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {confirmedCount > 0 && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {confirmedCount} confirmada{confirmedCount > 1 ? 's' : ''}
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todayClasses.map((classItem) => {
          const isConfirmed = !!classItem.attendance_confirmed_for_date;
          const today = new Date().toISOString().split('T')[0];
          const isConfirmedForToday = classItem.attendance_confirmed_for_date === today;

          return (
            <div
              key={classItem.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isConfirmedForToday
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{classItem.programmed_class.name}</h3>
                    {isConfirmedForToday && (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Confirmado
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
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Checkbox
                    id={`attendance-${classItem.id}`}
                    checked={isConfirmedForToday}
                    onCheckedChange={() => handleToggleConfirmation(classItem.id, isConfirmedForToday)}
                    disabled={confirmAttendance.isPending || cancelConfirmation.isPending}
                    className="h-6 w-6 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <label
                    htmlFor={`attendance-${classItem.id}`}
                    className="text-xs text-center cursor-pointer select-none"
                  >
                    {isConfirmedForToday ? 'Asistiré' : 'Confirmar'}
                  </label>
                </div>
              </div>
            </div>
          );
        })}

        {pendingCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>
                <strong>Recuerda:</strong> Confirma tu asistencia para que tu entrenador sepa que asistirás a clase.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
