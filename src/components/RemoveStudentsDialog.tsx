import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { UserMinus, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useClassParticipants, useBulkRemoveFromRecurringClass } from "@/hooks/useClassParticipants";
import { useToast } from "@/hooks/use-toast";

interface RemoveStudentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  clubId: string;
  classStartTime: string;
}

export function RemoveStudentsDialog({
  isOpen,
  onClose,
  classId,
  className,
  clubId,
  classStartTime,
}: RemoveStudentsDialogProps) {
  const { toast } = useToast();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const { data: participants = [], isLoading } = useClassParticipants(classId);
  const bulkRemoveMutation = useBulkRemoveFromRecurringClass();

  // Filter out substitute students - only show enrolled students
  const enrolledStudents = participants.filter(p => !p.is_substitute && p.status === 'active');

  const handleStudentToggle = (participantId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(participantId);
    } else {
      newSelected.delete(participantId);
    }
    setSelectedStudents(newSelected);
  };

  const handleRemoveStudents = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Sin selección",
        description: "Por favor, selecciona al menos un alumno para eliminar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Remove each selected student from all recurring classes
      for (const participantId of Array.from(selectedStudents)) {
        const participant = participants.find(p => p.id === participantId);

        if (participant) {
          await bulkRemoveMutation.mutateAsync({
            student_enrollment_id: participant.student_enrollment_id,
            class_id: classId,
            club_id: clubId,
            class_name: className,
            class_start_time: classStartTime,
          });
        }
      }

      toast({
        title: "Alumnos eliminados",
        description: `Se han eliminado ${selectedStudents.size} alumno(s) de todas las clases recurrentes de ${className}.`,
      });

      // Reset and close
      setSelectedStudents(new Set());
      setStep('select');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron eliminar los alumnos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleOpenConfirmStep = () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Sin selección",
        description: "Por favor, selecciona al menos un alumno para eliminar.",
        variant: "destructive",
      });
      return;
    }
    setStep('confirm');
  };

  const handleClose = () => {
    setSelectedStudents(new Set());
    setStep('select');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>Eliminar Alumnos de la Clase</DialogTitle>
              <DialogDescription>
                Selecciona los alumnos que deseas eliminar de <strong>TODAS</strong> las clases recurrentes de <strong>{className}</strong>.
                Los sustitutos no se muestran aquí, ya que solo están en clases específicas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay alumnos inscritos en esta clase</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {enrolledStudents.length} {enrolledStudents.length === 1 ? 'alumno inscrito' : 'alumnos inscritos'}
                    </p>
                    {selectedStudents.size > 0 && (
                      <Badge variant="secondary">
                        {selectedStudents.size} seleccionado{selectedStudents.size !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {enrolledStudents.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleStudentToggle(participant.id, !selectedStudents.has(participant.id))}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedStudents.has(participant.id)}
                          onCheckedChange={(checked) => handleStudentToggle(participant.id, !!checked)}
                          disabled={bulkRemoveMutation.isPending}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {participant.student_enrollment?.full_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {participant.student_enrollment?.email || 'Sin email'}
                          </div>
                        </div>
                      </div>
                      {participant.payment_status && (
                        <Badge
                          variant={participant.payment_status === 'paid' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {participant.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleOpenConfirmStep}
                disabled={selectedStudents.size === 0}
                className="gap-2"
              >
                <UserMinus className="h-4 w-4" />
                Eliminar {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                ¿Eliminar alumnos de todas las clases recurrentes?
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-2">
                <span className="block">
                  Estás a punto de eliminar <strong>{selectedStudents.size}</strong> alumno{selectedStudents.size !== 1 ? 's' : ''} de <strong>TODAS</strong> las clases recurrentes de "{className}" en esta hora.
                </span>
                <span className="block">
                  Los alumnos ya no verán estas clases en su dashboard y no podrán confirmar asistencia.
                </span>
                <span className="block font-semibold">
                  Esta acción no se puede deshacer.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                disabled={bulkRemoveMutation.isPending}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button
                onClick={handleRemoveStudents}
                disabled={bulkRemoveMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {bulkRemoveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Sí, eliminar de toda la serie'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
