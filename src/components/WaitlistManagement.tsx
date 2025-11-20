import { useState } from "react";
import { useClassWaitlist, useAcceptFromWaitlist, useRejectFromWaitlist } from "@/hooks/useClassWaitlist";
import { useStudentBehaviorMetrics, getReliabilityBadge } from "@/hooks/useStudentBehaviorMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle2, XCircle, UserCheck, Loader2, AlertTriangle, Ban, Skull, Check, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

interface WaitlistManagementProps {
  classId: string;
  classDate: string;
  className: string;
}

// Component to display student behavior metrics
const StudentMetricsDisplay = ({ studentEnrollmentId, classId }: { studentEnrollmentId: string; classId: string }) => {
  const { data: metrics, isLoading } = useStudentBehaviorMetrics(studentEnrollmentId, classId);
  const badge = getReliabilityBadge(metrics);

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-700">📊 Historial de asistencia:</span>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 h-4 ${
            badge.color === 'green' ? 'bg-green-100 text-green-700 border-green-300' :
            badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
            badge.color === 'red' ? 'bg-red-100 text-red-700 border-red-300' :
            badge.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-300' :
            'bg-gray-100 text-gray-700 border-gray-300'
          }`}
        >
          {badge.emoji} {badge.text}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="text-gray-600">Asistió:</span>
          <span className="font-semibold">{metrics.total_attended}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Skull className="h-3.5 w-3.5 text-orange-600" />
          <span className="text-gray-600">Avisos tardíos:</span>
          <span className="font-semibold text-orange-700">{metrics.late_notice_absences}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <X className="h-3.5 w-3.5 text-red-600" />
          <span className="text-gray-600">Avisos anticipados:</span>
          <span className="font-semibold text-red-700">{metrics.early_notice_absences}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <X className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-gray-600">Canceladas (club):</span>
          <span className="font-semibold">{metrics.club_cancelled_classes}</span>
        </div>
      </div>
    </div>
  );
};

const WaitlistManagement = ({ classId, classDate, className }: WaitlistManagementProps) => {
  const { data: waitlist = [], isLoading } = useClassWaitlist(classId, classDate);
  const { mutate: acceptStudent, isPending: isAccepting } = useAcceptFromWaitlist();
  const { mutate: rejectStudent, isPending: isRejecting } = useRejectFromWaitlist();

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    enrollmentId: string;
    name: string;
    action: 'accept' | 'reject';
  } | null>(null);

  const pendingWaitlist = waitlist.filter(w => w.status === 'pending');

  const handleAccept = (waitlistId: string, enrollmentId: string, name: string) => {
    setSelectedStudent({ id: waitlistId, enrollmentId, name, action: 'accept' });
  };

  const handleReject = (waitlistId: string, enrollmentId: string, name: string) => {
    setSelectedStudent({ id: waitlistId, enrollmentId, name, action: 'reject' });
  };

  const confirmAction = () => {
    if (!selectedStudent) return;

    if (selectedStudent.action === 'accept') {
      acceptStudent({
        waitlistId: selectedStudent.id,
        classId,
        classDate,
        studentEnrollmentId: selectedStudent.enrollmentId
      }, {
        onSuccess: () => setSelectedStudent(null)
      });
    } else {
      rejectStudent({
        waitlistId: selectedStudent.id,
        classId,
        classDate,
        studentEnrollmentId: selectedStudent.enrollmentId
      }, {
        onSuccess: () => setSelectedStudent(null)
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Users className="h-5 w-5" />
            Lista de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingWaitlist.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Espera
          </CardTitle>
          <CardDescription>
            {className} - {format(new Date(classDate), "d 'de' MMMM", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No hay alumnos en lista de espera
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Users className="h-5 w-5" />
                Lista de Espera
              </CardTitle>
              <CardDescription className="mt-1">
                {className} - {format(new Date(classDate), "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            <Badge className="bg-blue-600 text-white">
              {pendingWaitlist.length} {pendingWaitlist.length === 1 ? 'solicitud' : 'solicitudes'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {pendingWaitlist.map((entry, index) => {
              const student = entry.student_enrollment;
              if (!student) return null;

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border-2 border-blue-200 bg-white hover:shadow-md transition-shadow"
                >
                  {/* Header con info del estudiante y botones - Desktop */}
                  <div className="hidden md:flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          #{index + 1}
                        </Badge>
                        <span className="font-semibold text-lg">{student.full_name}</span>
                        {student.level && (
                          <Badge variant="secondary">
                            Nivel {student.level}
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Solicitado: {format(new Date(entry.requested_at), "HH:mm 'del' d MMM", { locale: es })}
                          </span>
                        </div>
                      </div>

                      {/* Student behavior metrics */}
                      <StudentMetricsDisplay
                        studentEnrollmentId={entry.student_enrollment_id}
                        classId={classId}
                      />
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAccept(entry.id, entry.student_enrollment_id, student.full_name)}
                        disabled={isAccepting || isRejecting}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(entry.id, entry.student_enrollment_id, student.full_name)}
                        disabled={isAccepting || isRejecting}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>

                  {/* Layout mobile optimizado */}
                  <div className="md:hidden flex flex-col gap-3">
                    {/* Primera sección: Info + Botones */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            #{index + 1}
                          </Badge>
                          <span className="font-semibold text-base">{student.full_name}</span>
                          {student.level && (
                            <Badge variant="secondary" className="text-xs">
                              Nivel {student.level}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email:</span>
                            <span className="truncate">{student.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>
                              Solicitado: {format(new Date(entry.requested_at), "HH:mm 'del' d MMM", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8 px-3"
                          onClick={() => handleAccept(entry.id, entry.student_enrollment_id, student.full_name)}
                          disabled={isAccepting || isRejecting}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-3"
                          onClick={() => handleReject(entry.id, entry.student_enrollment_id, student.full_name)}
                          disabled={isAccepting || isRejecting}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Segunda sección: Historial de asistencia */}
                    <StudentMetricsDisplay
                      studentEnrollmentId={entry.student_enrollment_id}
                      classId={classId}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Al aceptar un alumno, se agregará automáticamente a la clase y se expirarán
              las demás solicitudes pendientes para esta fecha.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedStudent?.action === 'accept' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Aceptar Alumno
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Rechazar Solicitud
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudent?.action === 'accept' ? (
                <>
                  ¿Estás seguro de que quieres aceptar a <strong>{selectedStudent?.name}</strong> en esta clase?
                  <br /><br />
                  Se agregará como participante activo y se notificarán las demás solicitudes que han sido descartadas.
                </>
              ) : (
                <>
                  ¿Estás seguro de que quieres rechazar la solicitud de <strong>{selectedStudent?.name}</strong>?
                  <br /><br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAccepting || isRejecting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isAccepting || isRejecting}
              className={selectedStudent?.action === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {(isAccepting || isRejecting) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WaitlistManagement;
